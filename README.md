# SA-TAFE para FibrasMX

Motor de pronóstico semanal para las 16 FIBRAs del sitio FibrasMX, basado en la
metodología TAFE del paper MDPI 2026 (Purata-Aldaz et al., *Simulated Annealing
Applied to Alternative Assets in Mexican Stock Exchange*).

## Metodología (en lenguaje simple)

1. **Descarga** los cierres semanales de cada FIBRA desde Yahoo Finance
   (hasta 5 años de historia; se exigen mínimo 78 semanas).
2. **6 pronosticadores base** intentan adivinar el precio futuro, cada uno con
   su lógica:
   - *naive*: "mañana vale lo mismo que hoy";
   - *drift*: sigue la tendencia recta de toda la historia;
   - *seasonal_naive*: "vale lo que valía hace 52 semanas";
   - *ar*: un modelo autorregresivo AR(p) ajustado por mínimos cuadrados
     (el orden p se elige con el criterio AIC);
   - *holt*: suavizado exponencial con tendencia lineal (Holt);
   - *ma12*: el promedio de las últimas 12 semanas.
3. **Validación rolling-origin**: se retrocede a varios puntos dentro de las
   últimas 26 semanas, se pronostica desde ahí y se mide el error con **sMAPE**
   (error porcentual absoluto simétrico). Es la misma métrica y el mismo
   horizonte (26 semanas) que usa el paper.
4. **Threshold Accepting**: un algoritmo de optimización busca la mejor
   combinación de pesos de los 6 pronosticadores (pesos que suman 1). Empieza
   con pesos iguales, prueba pequeños cambios y acepta el cambio si el sMAPE
   no empeora más que un umbral T; T se va reduciendo (×0.95 por ronda)
   durante 200 rondas. Gana la combinación con menor sMAPE de validación.
5. **Pronóstico final**: con los pesos óptimos se pronostican las próximas
   26 semanas y se calcula el retorno esperado
   `(precio_pronosticado_final / precio_actual − 1)` y la varianza de los
   retornos semanales implícitos.

## Regla de señales

Las FIBRAs cubiertas se **ordenan por retorno esperado a 26 semanas** y se
parten en tercios:

- tercio superior → **COMPRAR**
- tercio medio → **MANTENER**
- tercio inferior → **VENDER**

Toda señal lleva la etiqueta **"señal del modelo (no recomendación)"**.
El "portafolio" del JSON es el promedio simple de los miembros del tercio
COMPRAR. No es asesoría financiera.

## Cómo correrlo

```bash
cd ~/workspace/goals/fibrasmx-website/sa-tafe
python3 run_weekly.py
```

Solo requiere `numpy`, `pandas` y `requests` (nada más instalado en esta VM).
Escribe `results/sa-tafe-latest.json` y una copia fechada
`results/sa-tafe-YYYY-MM-DD.json` (fecha en horario de México).

## Archivos

- `tickers.py` — universo de 16 tickers + validación de que el nombre que
  devuelve Yahoo corresponde a una FIBRA. Si no (caso NEXT25.MX, que Yahoo
  resuelve a "Nearshoring Experts & Technology, S.C."), el ticker queda
  **SIN_DATOS / NO VERIFICADO** sin inventar nada.
- `tafe_engine.py` — descarga, los 6 pronosticadores base, validación
  rolling-origin, Threshold Accepting y pronóstico a 26 semanas.
- `run_weekly.py` — pipeline completo + asignación de señales por tercios +
  escritura del JSON.
- `results/` — salidas JSON.

## Limitaciones honestas

- **Solo ve precios.** No sabe de emisiones de CBFIs, cambios de administración,
  resultados trimestrales, tasas de interés ni noticias. Un evento corporativo
  puede invalidar el pronóstico de un día para otro.
- **Los pronósticos fallan.** El propio paper reporta que el ensemble optimizado
  se degrada fuera de muestra cuando hay cambios de régimen; los pesos se
  ajustan al pasado, no al futuro.
- **FMTY14**: su serie puede estar distorsionada por la adquisición de
  Macquarie; el modelo no lo sabe y lo trata como una serie más.
- **NEXT25** queda SIN_DATOS porque Yahoo no devuelve la FIBRA correcta con
  ese símbolo; no se sustituye por otro ticker a mano para no inventar datos.
- Señal del modelo ≠ recomendación de inversión. Es un ejercicio cuantitativo,
  no asesoría financiera.

## Actualización semanal en el sitio

Los datos del "Laboratorio cuantitativo" viven en **un solo lugar**: la tabla
`sa_tafe_runs` de la base de datos del artefacto **fibrasmx-2** (app.db). Cada
corrida semanal es una fila; la sección del sitio siempre muestra la fila con
`run_date` más reciente. **Actualizar los datos no requiere rebuild ni tocar
código**: basta insertar la fila de la nueva corrida.

### Procedimiento exacto del job semanal (cada lunes)

1. Correr el motor (genera el JSON de la semana):
   ```bash
   cd ~/workspace/goals/fibrasmx-website/sa-tafe
   python3 run_weekly.py
   ```
   Esto escribe `results/sa-tafe-latest.json` y la copia fechada
   `results/sa-tafe-YYYY-MM-DD.json` (fecha en horario de México).

2. Verificar el JSON antes de publicarlo:
   - `run_date` y `price_cutoff` en formato `YYYY-MM-DD` (p. ej. `2026-09-22`).
   - `horizon_weeks` = 26.
   - `tickers` es un arreglo y `portfolio` es un objeto con `members`,
     `expected_return` y `variance`.
   - NEXT25 debe seguir como `status: "SIN_DATOS"` sin números inventados.

3. Insertar la corrida en el sitio con la acción del artefacto
   `saveSaTafeRun` (vía `artifact.invoke_action` sobre el slug `fibrasmx-2`),
   con estos argumentos exactos:
   - `runDate`: el valor de `run_date` del JSON, formato `YYYY-MM-DD`.
   - `priceCutoff`: el valor de `price_cutoff` del JSON, formato `YYYY-MM-DD`.
   - `horizonWeeks`: el valor de `horizon_weeks` del JSON (número entero, 26).
   - `payloadJson`: el **contenido completo** de `results/sa-tafe-latest.json`
     como texto (string JSON, sin modificar).
   La acción valida que el texto sea JSON válido con `tickers[]` y `portfolio`,
   y hace **upsert por `runDate`**: si la corrida de esa fecha ya existe, la
   reemplaza; si no, crea una fila nueva.

4. Confirmar: abrir la pestaña **Laboratorio** del sitio y verificar que el
   encabezado diga `Actualizado: <fecha de runDate> · Corte de precios:
   <fecha de priceCutoff> · Próxima corrida: cada lunes`.

### Qué campos cambian cada semana

Solo se inserta **una fila nueva** en `sa_tafe_runs` con los 5 campos de arriba.
Nada más: ni el componente (`client/src/SaTafeLab.tsx`), ni los estilos, ni las
acciones, ni la migración necesitan cambios. Si alguna semana la corrida falla
o Yahoo no devuelve datos, **no se inserta nada** y el sitio sigue mostrando la
última corrida válida con su fecha visible.

### Si la sección aún no existe en el sitio

La primera instalación la hace el builder del artefacto siguiendo
`site-integration/INTEGRATION.md` (componente + estilos + 2 acciones +
migración 0009 que siembra la corrida 2026-09-17). Después de eso, el único
mantenimiento es este procedimiento semanal.
