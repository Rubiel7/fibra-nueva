# SA-TAFE — motor de pronóstico semanal para FibrasMX

## Qué es

SA-TAFE es el motor de pronóstico semanal que produce las señales cuantitativas
de las FIBRAs listadas en el sitio FibrasMX (16 tickers del universo). La
metodología TAFE sigue el paper MDPI 2026 de Purata-Aldaz et al.
(*Simulated Annealing Applied to Alternative Assets in Mexican Stock Exchange*),
adaptado con implementación propia en numpy/pandas (sin statsmodels ni yfinance).

En lenguaje simple, cada corrida:

1. **Descarga** los cierres semanales de cada FIBRA desde Yahoo Finance
   (hasta 5 años de historia; exige mínimo 78 semanas) con `requests`.
2. **6 pronosticadores base** intentan predecir el precio futuro: `naive`,
   `drift`, `seasonal_naive`, `ar` (autorregresivo con orden elegido por AIC),
   `holt` (suavizado exponencial con tendencia) y `ma12` (promedio de 12 semanas).
3. **Validación rolling-origin**: retrocede a varios puntos dentro de las
   últimas 26 semanas, pronostica desde ahí y mide el error con **sMAPE**
   (misma métrica y horizonte de 26 semanas que el paper).
4. **Threshold Accepting**: optimiza los pesos de los 6 pronosticadores
   (suman 1) durante 200 rondas, aceptando cambios que no empeoren el sMAPE
   más allá de un umbral T decreciente. Gana la combinación con menor error.
5. **Pronóstico final** a 26 semanas: retorno esperado
   `(precio_pronosticado_final / precio_actual − 1)` y varianza de los
   retornos semanales implícitos.

## Regla de señales

Las FIBRAs con datos válidos se **ordenan por retorno esperado a 26 semanas**
y se parten en tercios: **tercio superior → COMPRAR**, **medio → MANTENER**,
**inferior → VENDER**. Toda señal lleva la etiqueta obligatoria
**"señal del modelo (no recomendación)"**. El "portafolio" del JSON es el
promedio simple de los miembros del tercio COMPRAR. No es asesoría financiera.

**Restricción dura (del pipeline):** ningún dato inventado. Si la descarga o el
cálculo falla para un ticker, queda `status: "SIN_DATOS"` y el motivo se
registra en `notes`. Hoy eso aplica a **NEXT25** (Fibra Next): va en el JSON
como `SIN_DATOS`, sin precios ni números inventados.

## Qué hace `run_weekly.py`

Es el pipeline semanal completo, en este orden:

1. Descarga los cierres semanales de cada ticker del universo (`tickers.py`:
   16 tickers + validación de que el nombre devuelto por Yahoo corresponda).
2. Corre el motor TAFE (`tafe_engine.py`) ticker por ticker.
3. Verifica sanidad de cada resultado (nada de NaN; retornos en rango razonable).
4. Asigna señales por tercios y arma el "portafolio" COMPRAR.
5. Escribe **dos archivos idénticos**:
   - `results/sa-tafe-latest.json` (la corrida más reciente)
   - `results/sa-tafe-YYYY-MM-DD.json` (copia fechada; fecha en
     horario America/Chicago)

## Archivos

- `tafe_engine.py` — motor TAFE (descarga, 6 base learners, validación,
  Threshold Accepting, pronóstico a 26 semanas).
- `run_weekly.py` — pipeline semanal descrito arriba.
- `tickers.py` — universo de 16 tickers + validación de nombres de Yahoo.
- `results/` — salidas: `sa-tafe-latest.json` y copias fechadas.
- `requirements.txt` — dependencias de terceros (`numpy`, `pandas`, `requests`).

Fuente (solo lectura): `~/workspace/goals/fibrasmx-website/sa-tafe`
(no se incluye `site-integration/`, documentado por otro ingeniero).

## FLUJO SEMANAL

Cada **lunes ~17:37 (America/Chicago)**:

1. **Correr** en este directorio:
   ```bash
   python3 run_weekly.py
   ```
   Escribe `results/sa-tafe-latest.json` y la copia fechada
   `results/sa-tafe-YYYY-MM-DD.json`.

2. **Verificar** el JSON generado:
   - `run_date` y `price_cutoff` en formato `YYYY-MM-DD`;
   - `horizon_weeks == 26`;
   - `tickers` es un arreglo con los 16 tickers del universo;
   - `NEXT25` aparece con `status: "SIN_DATOS"` y **sin números inventados**
     (`last_price`, `price_date`, `expected_return_26w` deben ser `null`);
   - revisar `notes` por si hay tickers caídos o avisos.

3. **Publicar al sitio** con un upsert por `run_date` usando la acción
   **`saveSaTafeRun`** del sitio. Es una operación de datos: **sin rebuild y
   sin tocar código**.

**Si la corrida falla, NO se publica nada.** El sitio conserva la última
corrida válida publicada, con su `run_date` visible para el usuario, hasta
que una corrida posterior sí pase la verificación.

## Instalación

```bash
pip install -r requirements.txt
python3 run_weekly.py
```
