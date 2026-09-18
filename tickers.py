"""
FibrasMX SA-TAFE — Universo de tickers y validación de nombres de Yahoo.

El SA-TAFE solo trabaja sobre las 16 FIBRAs del sitio FibrasMX.
Ningún dato se inventa: si Yahoo devuelve un nombre que no corresponde a
una FIBRA, el ticker queda marcado como SIN_DATOS / NO VERIFICADO.
"""
import re

# Los 16 tickers del sitio FibrasMX (series mexicanas, sufijo .MX en Yahoo)
UNIVERSE = [
    "FUNO11", "DANHOS13", "FSHOP13", "FMTY14", "FIBRAMQ12", "FIBRAPL14",
    "FNOVA17", "FINN13", "FIHO12", "STORAGE18", "EDUCA18", "FCFE18",
    "FMX23", "FPLUS16", "FIBRAUP18", "NEXT25",
]

def yahoo_symbol(ticker: str) -> str:
    """Yahoo ticker = {TICKER}.MX"""
    return f"{ticker}.MX"

# Palabras que indican que el instrumento sí es una FIBRA / fideicomiso inmobiliario.
# Acepta inglés porque Yahoo a veces devuelve nombres traducidos ("Fibra" se mantiene
# en español en casi todos los casos).
_FIBRA_MARKERS = [
    "fibra",
    "fideicomiso",
    "fideicomiso inmobiliario",
    "real estate",
    "reits",
    "reit",
    "inmobiliar",  # Inmobiliaria / Inmobiliario (p.ej. "Fibra Inmobiliaria")
    "infraestructura",
    "infrastructure",
    "energy",
    "energía",
    "energia",
    "capital",      # p.ej. "Fibra Plus"
]

# Firmas de instrumentos conocidos que NO son FIBRAs (para documentar el rechazo).
_KNOWN_NON_FIBRA = {
    "NEXT25": "Nearshoring Experts & Technology, S.C.",
}


def looks_like_fibra(meta: dict) -> tuple[bool, str]:
    """
    Devuelve (es_valido, motivo).

    Revisa longName, shortName y symbol de la respuesta de Yahoo.
    El ticker solo es válido si el nombre contiene un marcador de FIBRA
    (fibra, fideicomiso, real estate, infraestructura, energía...).
    """
    if not meta:
        return False, "respuesta de Yahoo sin metadata"

    fields = [str(meta.get("longName") or ""),
              str(meta.get("shortName") or ""),
              str(meta.get("symbol") or "")]
    haystack = " ".join(fields).lower()

    for marker in _FIBRA_MARKERS:
        if marker in haystack:
            return True, f"nombre coincide ('{marker}')"

    return False, f"nombre no corresponde a una FIBRA: {fields[0] or fields[1] or fields[2]}"


def validate_ticker(ticker: str, meta: dict) -> dict:
    """Una línea de validación por ticker, lista para el JSON de resultados."""
    ok, reason = looks_like_fibra(meta)
    return {
        "ticker": ticker,
        "yahoo_symbol": yahoo_symbol(ticker),
        "nombre_yahoo": meta.get("longName") or meta.get("shortName") if meta else None,
        "valido": ok,
        "motivo": reason,
    }
