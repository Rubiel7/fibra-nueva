"""
FibrasMX SA-TAFE — Pipeline semanal.

fetch (Yahoo) → validación de nombres → motor TAFE → señales por tercios →
escribe results/sa-tafe-latest.json + copia fechada results/sa-tafe-YYYY-MM-DD.json.

REGLA DE SEÑAL (documentada):
  Las FIBRAs cubiertas se ordenan por expected_return_26w (pronóstico del
  modelo a 26 semanas). El tercio superior recibe COMPRAR, el tercio medio
  MANTENER y el tercio inferior VENDER.
  Etiqueta obligatoria: "señal del modelo (no recomendación)".

RESTRICCIÓN DURA: ningún dato inventado. Si un cálculo falla para un ticker,
queda status SIN_DATOS y el motivo se registra en notes. Nada de NaN/null
en los números de tickers OK.
"""
import json
import math
import os
import sys
import time
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

from tickers import UNIVERSE, validate_ticker
from tafe_engine import download_weekly, run_ticker, VAL_WEEKS

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESULTS_DIR = os.path.join(BASE_DIR, "results")
METHODOLOGY = "TAFE v1 (Threshold Accepting, sMAPE, 6 base learners)"
SIGNAL_LABEL = "señal del modelo (no recomendación)"


def _finite(x, ndigits):
    """Redondea; si no es finito devuelve None (pero eso solo ocurre con SIN_DATOS)."""
    return round(float(x), ndigits) if x is not None and math.isfinite(x) else None


def assign_signals(ok_tickers):
    """
    Ordena por expected_return_26w descendente y parte en tercios:
    COMPRAR (superior) / MANTENER (medio) / VENDER (inferior).
    """
    ranked = sorted(ok_tickers, key=lambda t: t["expected_return_26w"], reverse=True)
    n = len(ranked)
    # tercios: los primeros ceil(n/3) → COMPRAR, etc.
    cuts = [n - (n // 3) * 2, n - n // 3]  # índices de corte [comprar_end, mantener_end]
    # reparto simple y documentado:
    k1 = (n + 2) // 3          # tamaño del tercio superior
    k2 = (n + 2) // 3          # tamaño del tercio medio
    for i, t in enumerate(ranked):
        if i < k1:
            t["signal"] = "COMPRAR"
        elif i < k1 + k2:
            t["signal"] = "MANTENER"
        else:
            t["signal"] = "VENDER"
        t["signal_label"] = SIGNAL_LABEL
        t["signal_rank"] = i + 1
    return ranked


def main():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    notes = []
    tickers_out = []
    ok = []

    for ticker in UNIVERSE:
        print(f"[{datetime.now(timezone.utc):%H:%M:%S}] {ticker} ...", flush=True)
        t0 = time.time()

        # 1) descarga + validación del nombre de Yahoo (ningún dato inventado)
        try:
            _df, meta = download_weekly(ticker)
        except Exception as e:  # noqa: BLE001
            tickers_out.append({
                "ticker": ticker, "nombre_yahoo": None, "status": "SIN_DATOS",
                "last_price": None, "price_date": None, "weeks_data": 0,
                "expected_return_26w": None, "variance_26w": None,
                "signal": None, "signal_label": SIGNAL_LABEL,
            })
            notes.append(f"{ticker}: SIN_DATOS — error descargando datos ({e})")
            continue

        val = validate_ticker(ticker, meta)
        if not val["valido"]:
            tickers_out.append({
                "ticker": ticker, "nombre_yahoo": val["nombre_yahoo"],
                "status": "SIN_DATOS", "last_price": None, "price_date": None,
                "weeks_data": 0, "expected_return_26w": None, "variance_26w": None,
                "signal": None, "signal_label": SIGNAL_LABEL,
            })
            notes.append(f"{ticker}: SIN_DATOS / NO VERIFICADO — {val['motivo']}")
            continue

        # 2) motor TAFE
        try:
            res = run_ticker(ticker)
        except Exception as e:  # noqa: BLE001
            res = {"ticker": ticker, "status": "SIN_DATOS",
                   "motivo": f"fallo del motor: {e}"}

        if res.get("status") != "OK":
            tickers_out.append({
                "ticker": ticker, "nombre_yahoo": val["nombre_yahoo"],
                "status": "SIN_DATOS", "last_price": None, "price_date": None,
                "weeks_data": 0, "expected_return_26w": None, "variance_26w": None,
                "signal": None, "signal_label": SIGNAL_LABEL,
            })
            notes.append(f"{ticker}: SIN_DATOS — {res.get('motivo', 'sin motivo')}")
            continue

        # 3) verificación de sanidad: nada de NaN y retornos dentro de lo razonable
        sane = True
        for k in ("expected_return_26w", "variance_26w", "last_price"):
            if res.get(k) is None or not math.isfinite(res[k]):
                sane = False
        er = res["expected_return_26w"]
        if sane and not (-0.99 <= er <= 3.0):
            notes.append(f"{ticker}: AVISO — expected_return_26w={er:.2%} fuera de rango "
                         f"típico; se conserva pero revísalo antes de publicar")
        if not sane:
            tickers_out.append({
                "ticker": ticker, "nombre_yahoo": val["nombre_yahoo"],
                "status": "SIN_DATOS", "last_price": None, "price_date": None,
                "weeks_data": 0, "expected_return_26w": None, "variance_26w": None,
                "signal": None, "signal_label": SIGNAL_LABEL,
            })
            notes.append(f"{ticker}: SIN_DATOS — cálculo no finito")
            continue

        entry = {
            "ticker": ticker,
            "nombre_yahoo": res["nombre_yahoo"],
            "status": "OK",
            "last_price": res["last_price"],
            "price_date": res["price_date"],
            "weeks_data": res["weeks_data"],
            "expected_return_26w": res["expected_return_26w"],
            "variance_26w": res["variance_26w"],
            "validation_smape": res.get("validation_smape"),
            "weights": res.get("weights"),
            "signal": None,
            "signal_label": SIGNAL_LABEL,
        }
        ok.append(entry)
        tickers_out.append(entry)
        print(f"    OK  ER26={res['expected_return_26w']:+.2%}  sMAPE={res.get('validation_smape')}  "
              f"({time.time() - t0:.1f}s)", flush=True)

    # 4) señales por tercios
    ranked = assign_signals(ok)
    members = [t["ticker"] for t in ranked if t["signal"] == "COMPRAR"]
    port_er = float(sum(t["expected_return_26w"] for t in ok
                        if t["ticker"] in members) / len(members)) if members else None
    port_var = float(sum(t["variance_26w"] for t in ok
                         if t["ticker"] in members) / len(members)) if members else None

    price_cutoffs = sorted({t["price_date"] for t in ok if t.get("price_date")})
    # Fecha de la corrida en la zona horaria del usuario (CDT), no UTC.
    run_date = datetime.now(ZoneInfo("America/Chicago")).strftime("%Y-%m-%d")

    payload = {
        "run_date": run_date,
        "price_cutoff": price_cutoffs[-1] if price_cutoffs else None,
        "horizon_weeks": VAL_WEEKS,
        "methodology": METHODOLOGY,
        "signal_rule": ("Tercios por expected_return_26w: tercio superior=COMPRAR, "
                        "medio=MANTENER, inferior=VENDER. " + SIGNAL_LABEL + "."),
        "tickers": tickers_out,
        "portfolio": {
            "members": members,
            "expected_return": round(port_er, 6) if port_er is not None else None,
            "variance": round(port_var, 8) if port_var is not None else None,
            "note": "Promedio simple de los miembros del tercio COMPRAR. "
                    + SIGNAL_LABEL + ".",
        },
        "notes": notes,
    }

    latest = os.path.join(RESULTS_DIR, "sa-tafe-latest.json")
    dated = os.path.join(RESULTS_DIR, f"sa-tafe-{run_date}.json")
    with open(latest, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    with open(dated, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)

    print(f"\nCubiertos: {len(ok)}/{len(UNIVERSE)} | Sin datos: {len(UNIVERSE) - len(ok)}")
    print(f"Escrito: {latest}\n         {dated}")
    return payload


if __name__ == "__main__":
    main()
