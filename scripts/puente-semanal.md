# Puente semanal: motor SA-TAFE → sitio FibrasMX

Notas operativas del puente entre el motor SA-TAFE (Python, en `sa-tafe/`) y el sitio.

> **Nota:** este proceso hoy lo ejecuta una tarea programada. Este documento registra los pasos para hacerlo manualmente desde el repo clonado, si alguna vez hay que ejecutarlo a mano.

## Cuándo

Cada lunes, ~17:37 (America/Chicago), tras el cierre de la Bolsa Mexicana de Valores (BMV).

## Pasos

### 1. Correr el motor

```bash
cd sa-tafe && python3 run_weekly.py
```

- Tarda ~25 segundos.
- Escribe `results/sa-tafe-latest.json` y una copia fechada con la misma corrida.
- Dependencias en `sa-tafe/requirements.txt` (instalarlas antes si es la primera vez).

### 2. Verificar `results/sa-tafe-latest.json` ANTES de publicar

No publicar sin comprobar estos puntos en el JSON recién generado:

- `run_date` y `price_cutoff` en formato YYYY-MM-DD.
- `horizon_weeks` igual a 26.
- `tickers` como arreglo.
- `portfolio` con `members`, `expected_return` y `variance`.
- NEXT25 en `SIN_DATOS`, sin números inventados.

### 3. Publicar al sitio

- Hacer upsert por `run_date` vía la acción `saveSaTafeRun` del servidor.
- La acción valida el JSON.
- No requiere rebuild y no toca código.

### 4. Si algo falla

**NO publicar nada.** El sitio conserva la última corrida válida con su fecha visible.
