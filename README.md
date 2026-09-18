# FibrasMX — Sitio de análisis de FIBRAs mexicanas

FibrasMX es el sitio de análisis de FIBRAs (fideicomisos de inversión en bienes raíces) de México. El proyecto unificado consolida en un solo repositorio todo el trabajo: el sitio web, el motor analítico SA-TAFE, la documentación y el legado de los proyectos anteriores.

## Qué incluye

- **Precios en vivo** de las FIBRAs listadas en la Bolsa Mexicana.
- **Perfiles por FIBRA**: ficha individual con datos, noticias, gráficos y reportes.
- **Comparador**: comparación lado a lado de FIBRAs.
- **Calculadora**: cálculo de rendimientos y escenarios de inversión.
- **Portafolio**: seguimiento de las posiciones del usuario.
- **Favoritos**: lista personal de FIBRAs seguidas.
- **Alertas**: (estado parcial, ver nota de honestidad más abajo).
- **Centro Publicar**: publicación de videos (YouTube o Vimeo) y reportes en PDF por FIBRA y categoría.
- **Ratios en Vivo**: razones financieras actualizadas.
- **Laboratorio SA-TAFE**: motor de análisis cuantitativo con flujo semanal de actualización.

## Mapa del árbol

```
.
├── client/          # Frontend del sitio (interfaz)
├── server/          # Backend del sitio (API, precios, alertas, publicar)
├── drizzle/         # Migraciones y semillas de la base de datos SQLite
├── vendor/          # SDK local (hace `bun install` reproducible en cualquier máquina)
├── sa-tafe/         # Motor Python SA-TAFE + flujo semanal de actualización
├── scripts/
│   ├── setup.sh          # Instalación, migración de SQLite y compilación
│   └── puente-semanal.md # Documentación del flujo semanal
├── docs/                           # Documentación técnica
│   ├── 00-INDICE.md                # Índice de la documentación
│   ├── 01-sitio.md                 # Qué es FibrasMX
│   ├── 02-integracion-sa-tafe.md   # El Laboratorio cuantitativo en el sitio
│   ├── 03-plan-de-datos.md         # Orígenes y tablas de datos
│   ├── 04-autenticacion.md         # Login de dos roles (no activado)
│   ├── 05-agentes.md               # Guía de contribución
│   └── 06-job-semanal-y-notas.md   # Flujo semanal SA-TAFE y notas
├── legado/                         # Proyectos anteriores (referencia)
│   ├── app-ingeniero               # Código del ingeniero (+ NOTA-DE-AUTORIA.md)
│   └── mis-fibras                  # Borrador Mis FIBRAs (+ NOTA.md)
```

## Cómo clonar y correr idéntico

Pasos exactos y numerados:

1. `git clone https://github.com/Rubiel7/fibra-nueva.git`
2. `cd fibra-nueva`
3. Instalar **bun 1.3.10** (la versión declarada en `package.json`; `setup.sh` avisa si la tuya difiere).
4. `bash scripts/setup.sh` — instala dependencias, ejecuta la migración de SQLite, verifica tipos y compila el servidor.

## Nota de honestidad

El servidor está diseñado para correr dentro del runtime de su plataforma original. Este repositorio contiene el **100% del código, las migraciones y las semillas**, y clonar + compilar reproduce el proyecto **idéntico a nivel de código**.

Estado real de los módulos (sin exagerar):

- **Alertas (parciales)**: se pueden crear alertas, pero aún no se pueden listar, borrar ni evaluar automáticamente.
- **Login de dos roles**: el sistema de login con roles de administrador y usuario está construido en el código, pero **no está activado en la UI**; su activación queda a decisión de Rubiel.
- **Compilación del cliente**: `bun run build:server` compila sin errores, pero `bun run build:client` está bloqueado por diseño fuera del pipeline oficial de la plataforma (el SDK exige su driver de compilación). El código del cliente está sano y compila sin errores —verificado en prueba de build limpio con bun 1.3.10—, pero la publicación oficial requiere las herramientas de la plataforma.

## Flujo semanal SA-TAFE (resumen)

Cada **lunes ~17:37 (hora de Chicago)**:

1. Ejecutar `python3 sa-tafe/run_weekly.py`.
2. Verificar el JSON generado.
3. Hacer el upsert de los resultados vía `saveSaTafeRun` (sin rebuild del sitio).

El detalle completo está en `docs/06-job-semanal-y-notas.md` y en `scripts/puente-semanal.md`.

## Autoría

- El código de `legado/app-ingeniero` fue desarrollado por **inmerzorrilla** como trabajo encargado por Rubiel Valencia. Se conserva su autoría; no se presenta como propio.
- El resto del proyecto es de **Rubiel Valencia**, construido con su asistente de IA.
