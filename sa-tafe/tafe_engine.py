"""
FibrasMX SA-TAFE — Motor TAFE (Time-series Adaptive Forecast Ensemble).

Basado en la metodología del paper MDPI 2026 (Purata-Aldaz et al.):
  - TAFE = ensemble de pronosticadores base, con pesos optimizados por
    Threshold Accepting (TA) minimizando el error de pronóstico.
  - Series semanales de Yahoo Finance, horizonte out-of-sample de 26 semanas.
  - Métrica: sMAPE (Symmetric Mean Absolute Percentage Error).

Implementación propia en numpy/pandas/requests (sin statsmodels ni yfinance).
6 pronosticadores base:
  1. naive            — último valor repetido
  2. drift            — extrapolación lineal de la tendencia (último - primero)
  3. seasonal_naive   — valor de hace 52 semanas
  4. ar               — AR(p) por mínimos cuadrados, p elegido por AIC (1..12)
  5. holt             — Holt de tendencia lineal (alpha, beta por grid-search)
  6. ma12             — promedio móvil de 12 semanas

Validación: rolling-origin sobre las últimas 26 semanas (orígenes cada 4
semanas), sMAPE medio de los orígenes como objetivo.

Threshold Accepting sobre el simplex de pesos (6 dimensiones):
  - inicia con pesos iguales, perturba transfiriendo delta entre dos pesos,
    acepta si nuevo_sMAPE <= viejo_sMAPE + T, T decae geométricamente (T *= 0.95).
"""
import json
import time
from datetime import datetime, timezone

import numpy as np
import pandas as pd
import requests

from tickers import yahoo_symbol

UA = {"User-Agent": "Mozilla/5.0"}
CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{sym}?interval=1wk&range=5y"
MIN_WEEKS = 78          # mínimo de historia exigido; si menos → SIN_DATOS
VAL_WEEKS = 26          # ventana de validación / horizonte del paper
ORIGIN_STEP = 4         # separación entre orígenes de validación
TA_ROUNDS = 200         # rondas de Threshold Accepting
TA_DECAY = 0.95
TA_T0 = 1.0             # umbral inicial (en puntos de sMAPE)
SEED = 42

FORECASTERS = ["naive", "drift", "seasonal_naive", "ar", "holt", "ma12"]


# ---------------------------------------------------------------- descargas
def download_weekly(ticker: str, timeout: int = 30):
    """Descarga cierres semanales de Yahoo. Devuelve (df, meta)."""
    sym = yahoo_symbol(ticker)
    r = requests.get(CHART_URL.format(sym=sym), headers=UA, timeout=timeout)
    r.raise_for_status()
    payload = r.json()
    chart = payload.get("chart", {})
    if chart.get("error"):
        raise RuntimeError(f"Yahoo error para {sym}: {chart['error'].get('description')}")
    result = chart["result"][0]
    meta = result.get("meta", {})
    ts = result["timestamp"]
    closes = result["indicators"]["quote"][0]["close"]
    df = pd.DataFrame({
        "date": pd.to_datetime(ts, unit="s", utc=True),
        "close": closes,
    }).dropna(subset=["close"])
    df = df[df["close"] > 0].reset_index(drop=True)
    return df, meta


# ---------------------------------------------------------------- métrica
def smape(actual: np.ndarray, forecast: np.ndarray) -> float:
    """sMAPE en %: 200/n * sum(|F-A| / (|A|+|F|))."""
    a = np.asarray(actual, dtype=float)
    f = np.asarray(forecast, dtype=float)
    n = min(len(a), len(f))
    a, f = a[:n], f[:n]
    denom = np.abs(a) + np.abs(f)
    mask = denom > 0
    if not mask.any():
        return float("nan")
    return float(200.0 * np.mean(np.abs(f[mask] - a[mask]) / denom[mask]))


# ------------------------------------------------------- pronosticadores base
def _fit_ar(y: np.ndarray, p: int):
    """Coeficientes AR(p) por mínimos cuadrados. Devuelve (coef, intercept, sse, k)."""
    n = len(y)
    if n <= p + 1:
        return None
    Y = y[p:]
    X = np.column_stack([y[p - i - 1:n - i - 1] for i in range(p)] + [np.ones(n - p)])
    coef, *_ = np.linalg.lstsq(X, Y, rcond=None)
    resid = Y - X @ coef
    sse = float(resid @ resid)
    return coef, sse, p + 1


def _pick_ar_order(y: np.ndarray, pmax: int = 12):
    best = None
    best_aic = np.inf
    for p in range(1, min(pmax, len(y) - 2) + 1):
        fit = _fit_ar(y, p)
        if fit is None:
            continue
        coef, sse, k = fit
        n = len(y) - p
        aic = n * np.log(max(sse, 1e-12) / n) + 2 * k
        if aic < best_aic:
            best_aic, best = aic, (coef, p)
    return best  # (coef, p) o None


def _fit_holt_params(y: np.ndarray):
    """Grid-search de alpha, beta minimizando SSE de 1 paso."""
    best = (0.5, 0.1, np.inf)
    for alpha in (0.1, 0.3, 0.5, 0.7, 0.9):
        for beta in (0.05, 0.1, 0.3, 0.5, 0.7):
            level, trend = y[0], (y[min(3, len(y) - 1)] - y[0]) / max(min(3, len(y) - 1), 1)
            sse = 0.0
            for t in range(1, len(y)):
                f1 = level + trend
                sse += (y[t] - f1) ** 2
                prev_level = level
                level = alpha * y[t] + (1 - alpha) * (level + trend)
                trend = beta * (level - prev_level) + (1 - beta) * trend
            if sse < best[2]:
                best = (alpha, beta, sse)
    return best[0], best[1]


def base_forecast(y: np.ndarray, h: int, name: str) -> np.ndarray:
    """Pronóstico a h pasos de un pronosticador base, dado el historial y."""
    y = np.asarray(y, dtype=float)
    n = len(y)
    last = y[-1]
    if name == "naive":
        return np.full(h, last)
    if name == "drift":
        slope = (y[-1] - y[0]) / (n - 1) if n > 1 else 0.0
        return last + slope * np.arange(1, h + 1)
    if name == "seasonal_naive":
        out = np.empty(h)
        for i in range(h):
            idx = n - 52 + (i % 52)
            out[i] = y[idx] if idx >= 0 else last
        return out
    if name == "ar":
        pick = _pick_ar_order(y)
        if pick is None:
            return np.full(h, last)
        coef, p = pick
        hist = list(y[-p:])
        out = []
        for _ in range(h):
            X = np.array(hist[-p:] + [1.0])
            nxt = float(X @ coef)
            out.append(nxt)
            hist.append(nxt)
        return np.array(out)
    if name == "holt":
        alpha, beta = _fit_holt_params(y)
        level, trend = y[0], (y[min(3, n - 1)] - y[0]) / max(min(3, n - 1), 1)
        for t in range(1, n):
            prev_level = level
            level = alpha * y[t] + (1 - alpha) * (level + trend)
            trend = beta * (level - prev_level) + (1 - beta) * trend
        return level + trend * np.arange(1, h + 1)
    if name == "ma12":
        return np.full(h, np.mean(y[-12:]) if n >= 12 else np.mean(y))
    raise ValueError(f"pronosticador desconocido: {name}")


# ---------------------------------------------------- validación rolling-origin
def validation_origins(n: int):
    """Índices de corte (orígenes) dentro de las últimas VAL_WEEKS semanas."""
    origins = []
    start = n - VAL_WEEKS
    for o in range(start, n, ORIGIN_STEP):
        if o >= 60:  # historia mínima para ajustar los base learners
            origins.append(o)
    return origins


def origin_forecasts(y: np.ndarray, origin: int, h: int):
    """Pronósticos de los 6 base learners desde `origin`, h pasos. Matriz (6, h)."""
    hist = y[:origin]
    return np.array([base_forecast(hist, h, name) for name in FORECASTERS])


def ensemble_smape(weights: np.ndarray, y: np.ndarray, origins) -> float:
    """sMAPE medio de validación del ensemble con estos pesos."""
    smapes = []
    for o in origins:
        fut = y[o:o + VAL_WEEKS]
        h = len(fut)
        if h == 0:
            continue
        F = origin_forecasts(y, o, h)          # (6, h)
        ens = weights @ F                      # (h,)
        ens = np.maximum(ens, 1e-6)            # precios no negativos
        smapes.append(smape(fut, ens))
    smapes = [s for s in smapes if np.isfinite(s)]
    return float(np.mean(smapes)) if smapes else float("nan")


# ------------------------------------------------------- Threshold Accepting
def _project_simplex(w: np.ndarray) -> np.ndarray:
    w = np.maximum(w, 0.0)
    s = w.sum()
    return w / s if s > 0 else np.full_like(w, 1.0 / len(w))


def threshold_accepting(objective, dim: int, rounds: int = TA_ROUNDS,
                        t0: float = TA_T0, decay: float = TA_DECAY,
                        seed: int = SEED):
    """TA clásico sobre el simplex de pesos. Minimiza objective(w)."""
    rng = np.random.default_rng(seed)
    w = np.full(dim, 1.0 / dim)
    best_w, best_val = w.copy(), objective(w)
    cur_w, cur_val = w.copy(), best_val
    T = t0
    for _ in range(rounds):
        # perturba: transfiere delta entre dos coordenadas aleatorias
        i, j = rng.choice(dim, size=2, replace=False)
        delta = rng.uniform(0.01, 0.15)
        cand = cur_w.copy()
        move = min(delta, cand[i])
        cand[i] -= move
        cand[j] += move
        cand = _project_simplex(cand)
        val = objective(cand)
        if np.isfinite(val) and val <= cur_val + T:
            cur_w, cur_val = cand, val
            if val < best_val:
                best_w, best_val = cand.copy(), val
        T *= decay
    return best_w, best_val


# ------------------------------------------------------------------ motor
def run_ticker(ticker: str) -> dict:
    """
    Corre el motor TAFE completo para un ticker.
    Devuelve el dict listo para el JSON (status OK o SIN_DATOS).
    """
    out = {"ticker": ticker, "status": "OK"}
    try:
        df, meta = download_weekly(ticker)
    except Exception as e:  # noqa: BLE001 - cualquier fallo de red/API → SIN_DATOS
        out.update(status="SIN_DATOS", motivo=f"error descargando datos: {e}")
        return out

    n = len(df)
    if n < MIN_WEEKS:
        out.update(status="SIN_DATOS",
                   motivo=f"solo {n} semanas de historia (< {MIN_WEEKS} mínimas)")
        return out

    y = df["close"].to_numpy(dtype=float)
    last_price = float(y[-1])
    price_date = df["date"].iloc[-1].strftime("%Y-%m-%d")

    origins = validation_origins(n)
    if not origins:
        out.update(status="SIN_DATOS", motivo="sin orígenes de validación suficientes")
        return out

    # Precomputa pronósticos base por origen (no dependen de los pesos)
    cache = {}
    for o in origins:
        h = min(VAL_WEEKS, n - o)
        cache[o] = origin_forecasts(y, o, h)

    def objective(w):
        smapes = []
        for o in origins:
            fut = y[o:o + VAL_WEEKS]
            ens = np.maximum(w @ cache[o], 1e-6)
            smapes.append(smape(fut, ens))
        smapes = [s for s in smapes if np.isfinite(s)]
        return float(np.mean(smapes)) if smapes else np.inf

    weights, val_smape = threshold_accepting(objective, len(FORECASTERS))

    # Pronóstico final a 26 semanas con historial completo
    F_final = np.array([base_forecast(y, VAL_WEEKS, name) for name in FORECASTERS])
    forecast = np.maximum(weights @ F_final, 1e-6)

    if not np.all(np.isfinite(forecast)) or last_price <= 0:
        out.update(status="SIN_DATOS", motivo="pronóstico no finito")
        return out

    expected_return = float(forecast[-1] / last_price - 1.0)
    weekly_rets = np.diff(forecast) / forecast[:-1]
    variance = float(np.var(weekly_rets)) if len(weekly_rets) else 0.0

    out.update(
        nombre_yahoo=meta.get("longName") or meta.get("shortName"),
        last_price=round(last_price, 4),
        price_date=price_date,
        weeks_data=n,
        expected_return_26w=round(expected_return, 6),
        variance_26w=round(variance, 8),
        validation_smape=round(float(val_smape), 4),
        weights={name: round(float(w), 4) for name, w in zip(FORECASTERS, weights)},
    )
    return out


if __name__ == "__main__":
    # Prueba rápida con un ticker
    t0 = time.time()
    print(json.dumps(run_ticker("FUNO11"), indent=2, ensure_ascii=False))
    print(f"({time.time() - t0:.1f}s)")
