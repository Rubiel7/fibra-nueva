# Job semanal SA-TAFE y notas del proyecto

## Parte 1 — El job semanal SA-TAFE

El SA-TAFE ("Laboratorio cuantitativo" del sitio FibrasMX) se actualiza
automáticamente **cada lunes ~17:37 (hora de Chicago)**, después del cierre de
la Bolsa Mexicana de Valores. Es una actualización silenciosa de datos: no
genera avisos visibles al usuario; el sitio siempre muestra la fecha de la
última corrida válida.

### Pasos del job

1. **Correr el motor.** Ejecutar `python3 run_weekly.py` en el directorio
   `sa-tafe/`. Tarda aproximadamente 25 segundos y produce dos artefactos en
   `sa-tafe/results/`: el archivo `sa-tafe-latest.json` y una copia fechada de
   la misma corrida.

2. **Verificar el JSON antes de publicar.** Abrir `sa-tafe-latest.json` y
   confirmar que:
   - `run_date` y `price_cutoff` estén en formato `YYYY-MM-DD`.
   - `horizon_weeks` sea igual a 26.
   - `tickers` sea un arreglo.
   - `portfolio` incluya `members`, `expected_return` y `variance`.
   - La FIBRA NEXT25 (NEXT25) siga con `status: "SIN_DATOS"` y sin números
     inventados.

   ⚠️ **Si algo falla, NO publicar nada.** El sitio conserva la última corrida
   válida, con su fecha visible, hasta que una corrida completa pase la
   verificación.

3. **Publicar en el sitio (sin rebuild).** Guardar la corrida en el sitio
   llamando a la acción `saveSaTafeRun` con estos argumentos:
   - `runDate` — el valor de `run_date`.
   - `priceCutoff` — el valor de `price_cutoff`.
   - `horizonWeeks` — 26.
   - `payloadJson` — el contenido completo de `sa-tafe-latest.json` como
     texto, sin modificar.

   La acción valida el JSON y realiza el upsert por `run_date`: si ya existe
   una corrida con esa fecha, la reemplaza; si no, la crea.

4. **Registrar en el log.** Agregar una línea al log semanal con la fecha de
   la corrida, el número de tickers OK / SIN_DATOS y el conteo de señales
   COMPRAR / MANTENER / VENDER.

### Reglas

- No se escriben reportes por corrida fuera del log semanal.
- Nunca se publican resultados sin verificar: los datos inválidos se
  descartan y el sitio sigue mostrando la última corrida válida.
- La referencia completa del procedimiento está en el README del motor
  (`sa-tafe/README.md`, sección "Actualización semanal en el sitio").

---

## Parte 2 — Notas del proyecto

**Objetivo.** Publicar el código de FibrasMX en GitHub como un proyecto
único, integrado y reproducible: clonar → instalar → migrar → compilar →
correr, con el mismo resultado cada vez.

**Fuente de la verdad.** El repositorio es la fuente de la verdad del
proyecto. Todo el código, la configuración y la documentación que definen
cómo corre el sistema viven en el repositorio, de modo que cualquier persona
pueda reproducir el proyecto completo siguiendo el flujo estándar:

1. Clonar el repositorio.
2. Instalar las dependencias.
3. Ejecutar las migraciones.
4. Compilar.
5. Correr el sitio, idéntico al publicado.

**Autoría.** El código desarrollado por el ingeniero contratado vive en el
directorio `legado/` y conserva su autoría original (inmerzorrilla,
trabajo encargado). La integración posterior se construye sobre ese código
respetando dicha autoría.
