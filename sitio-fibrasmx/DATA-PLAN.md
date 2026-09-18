# Data Plan

## Context provenance
- “este es un código que mandé hacer pero no me hicieron completo” (solicitud actual; el repositorio GitHub suministrado es la base funcional y visual).
- “Lo videos embebidos o de vimeo serias progresivos por eso quiero una sección donde subir donde publicar” (solicitud actual; define el flujo de publicación de enlaces, no archivos de video).
- Brief técnico verificado del padre: conservar catálogo, precios, comparación, calculadora, portafolio, favoritos, alertas y exportación, y añadir publicaciones de video y PDF por FIBRA.
- Grabación suministrada `workspace/user/media_library/video/0d/0de28918ec3c1a162998ed529007ccd1af2b74430b487d655c0b56c0458827bf.mp4`: inspección local, 126 s, 720×1558; confirmó identidad oscura/roja, perfiles con pestañas, reportes trimestrales, carrusel de FIBRAs y galería de videos.

## Tested sources
### Repositorio base del usuario
**Used by**: catálogo estático, rutas y capacidades a conservar, logos locales y lenguaje visual.
**Test command**: `git clone --depth 1 https://github.com/inmerzorrilla/fibras /tmp/fibras-source`
**Sample output**: Next.js 14 bajo `nextjs_space`; 6 páginas, 7 rutas API, Prisma, `lib/fibras-data.ts`, `lib/sa-tafe.ts`, 16 PNG en `public/logos/`.
**Processing**: adaptar a acciones TypeScript y DB del web artifact; no copiar `.env`, rutas fijas ni dependencias innecesarias.

### Cotizaciones administradas por Muse
**Used by**: `getMarketData`, `getFibraDetail`.
**Test command**: `bun /opt/hatch/skills/spaces/ts-runtime/dist/probe-ctx.js < /tmp/probe-fibras-finance3.ts`
**Sample output**: `NEXT25.MX` resolvió exacto como Fideicomiso Irrevocable No 7401, precio 96 MXN, variación -0.6211%, `as_of` 2026-09-17T19:47:48Z; `FUNO11.MX` resolvió exacto, 29.88 MXN; `NEXT20.MX` no resolvió.
**Processing**: una llamada `ctx.tool.finance_ticker` por símbolo, caché persistente de 5 minutos, conservar `as_of`, mostrar hueco honesto si un símbolo falla; TERRA13 permanece como ficha histórica “Deslistada”, nunca como cotización operable.

### Históricos de Yahoo Finance
**Used by**: serie de 30 días de la gráfica de precio histórico cuando la cotización administrada no incluye puntos.
**Declared host**: `query1.finance.yahoo.com` (consultado por `yahoo-finance2`).
**Test command**: `getHistorical("FNOVA17.MX", "30d")` y `getHistorical("FUNO11.MX", "30d")` desde el módulo del servidor.
**Sample output**: 21 puntos válidos para cada símbolo, del 18 de agosto al 17 de septiembre de 2026, con fecha y cierre no nulo.
**Processing**: `yahooFinance.chart` con `period1` como `Date` e intervalo diario; mapear `result.quotes`, descartar cierres nulos y conservar el caché persistente de 5 minutos de `getMarketData`.

### SA-TAFE del usuario
**Used by**: `getMarketData`, `getFibraDetail`.
**Test command**: `bun /opt/hatch/skills/spaces/ts-runtime/dist/probe-ctx.js < /tmp/probe-sa-tafe.ts` y `< /tmp/probe-sa-tafe2.ts`.
**Sample output**: ambos endpoints respondieron HTTP 200. `TRAINING_DATA_FIBRAS.json` contiene DANHOS13, FMTY14, FUNO11… y `SHOP13`; no STORAGE18, NEXT25 ni FMX23. `DATABASE_MASTER_SA_TAFE.json` contiene `NaN` y falla JSON.parse estándar (`Unexpected identifier "NaN"`).
**Processing**: sanear tokens `NaN` a `null` antes de parsear, normalizar alias `SHOP13→FSHOP13`, unir solo campos existentes y mostrar “Sin señal SA-TAFE” cuando falte una entrada; caché de 10 minutos.

### Videos de YouTube y Vimeo
**Used by**: `publishVideo`, galería, pestaña Videos.
**Test command**: validación de contrato según `/opt/hatch/skills/artifacts/references/social-embeds.md`.
**Sample output**: YouTube se incrusta por endpoint oficial `/embed/{id}`; otros proveedores solo mediante endpoint oficial. La reproducción debe degradar a enlace visible si el iframe está bloqueado.
**Processing**: aceptar únicamente URL HTTPS válida de YouTube/Vimeo, extraer ID, guardar proveedor/ID/enlace original; iframe `youtube-nocookie.com/embed/{id}` o `player.vimeo.com/video/{id}` con sandbox y enlace de respaldo. No hotlink de miniaturas: usar un póster tipográfico neutral por proveedor para evitar medios expiring.

### Imágenes y logos
**Used by**: catálogo y perfiles.
**Test command**: `gm identify -format '%wx%h %m' /tmp/fibras-source/nextjs_space/public/logos/*.png`
**Sample output**: 16 archivos PNG, todos 1024×1024, válidos. Slots aceptados: FUNO, FIBRAPL, FIBRAMQ, DANHOS, FSHOP, FINN, FIHO, FMTY, FPLUS, NEXT, FNOVA, FHIPO, EDUCA, STORAGE, FCFE, TERRA; procedencia: repositorio provisto por el usuario. Para FMX23, búsqueda de imagen pública devolvió el logotipo FIBRAeMX exacto en `https://s3-symbol-logo.tradingview.com/fibraemx--600.png`, con página de origen `https://es.tradingview.com/symbols/BIVA-FMX%2F23/`; preflight HTTP 200 `image/png`, descarga válida 600×600.
**Processing**: copiar bytes válidos a `client/src/assets/logos/`; reemplazar la referencia equivocada a FCFE por `fmx23.png`; no renderizar URLs remotas.

## Web-search sources
### Símbolo correcto de Fibra Next
**Delivered by**: catálogo corregido y consulta financiera.
**Checked with**: búsqueda “Fibra Next ticker Yahoo Finance México BMV símbolo”; BMV/TradingView identifican `NEXT/25`, y la prueba de `ctx.tool.finance_ticker("NEXT25.MX")` confirmó cotización real en MXN.

### Historial de distribuciones a 2 años
**Used by**: bloque “Historial de distribuciones (2 años)” en la pestaña Pagos de cada perfil.
**Source supplied in the current request**: series exactas capturadas de las tablas de dividendos de BolsApp el 17-sep-2026 para FUNO11, FIBRAPL14, FIBRAUP18, FIBRAMQ12, DANHOS13, FSHOP13, FINN13, FIHO12, FMTY14, FPLUS16, STORAGE18, FCFE18 y EDUCA18. FNOVA17 y FHIPO14 proceden del barrido web del 17-sep-2026. FMX23 no tiene historial verificado.
**Processing**: conservar el orden cronológico y los montos por CBFI; mostrar una mini-gráfica cuando hay al menos dos pagos, la lista numérica completa, tendencia, predictibilidad y notas de contexto. Para FNOVA17 y FHIPO14 se muestra solo el último monto verificable y se declara que el barrido no entregó la serie completa; para FMX23 se muestra “—” y se remite al reporte oficial. La predictibilidad describe regularidad histórica, no una recomendación ni una promesa de pago.

## Long-term data behavior
- **Refresh policy**: cotizaciones se solicitan al abrir y se reutilizan hasta 5 minutos; SA-TAFE hasta 10 minutos. Sin cron ni hooks.
- **Growth**: videos, reportes, favoritos, alertas y posiciones crecen por acciones del usuario; PDF binario en `ctx.blobs`, solo metadatos/clave en DB.
- **Ordering**: catálogo por orden base; videos/reportes por publicación descendente; reportes además agrupables por año/periodo.
- **Time semantics**: `created_at` y `as_of` se guardan como instantes UTC y se presentan en hora local del visor; año/periodo de un reporte son campos editoriales, no tiempos inferidos.

## Rejected approaches
- **Tried**: `NEXT20.MX` para Fibra Next.
  **Why rejected**: la fuente devolvió `matched:none`; `NEXT25.MX` devolvió instrumento exacto y precio en MXN.
- **Tried**: parsear SA-TAFE con `JSON.parse` directo.
  **Why rejected**: `DATABASE_MASTER_SA_TAFE.json` contiene `NaN`; se requiere saneamiento controlado.
- **Tried**: usar `fcfe.png` para FMX23 o una imagen de búsqueda genérica “FMX”.
  **Why rejected**: representan otra entidad o un monograma genérico; se reemplazó por el logo exacto FIBRAeMX encontrado en búsqueda y preflight validado.
- **Tried**: leer directamente el sitio Manus.
  **Why rejected**: el lector web no pudo obtener la página; la grabación aportada por el usuario fue la fuente visual verificable.


### Ocupación y número de propiedades · ficha rápida
**Used by**: pestaña Resumen, bloque “Ficha rápida”, y pestaña Ocupación de cada perfil.
**Source supplied in the current request**: cifras exactas del 2T26 para las 16 FIBRAs del catálogo, con fuente, fecha disponible y periodo por métrica. Incluye reportes 2T26 vía BMV, PR Newswire, el earnings release oficial de fibramacquarie.com, fibradanhos.com.mx, fibrainn.mx, Investorcloud de Fibra Mty, Grupo Bafar y FibraEDUCA, fibrastorage.com y Actinver, según la atribución individual entregada.
**Processing**: conservar literalmente cada cifra principal y su desglose; no dejar guiones como sustituto de ocupación o propiedades. Mostrar `no aplica (2T26)` con explicación para FHIPO14, FCFE18 y FMX23 porque no son portafolios inmobiliarios comparables. Cada métrica lleva su propia línea `Referencia capturada · {fuente}, {fecha}`; cuando la solicitud no aporta día de publicación, `2T26` identifica el corte sin inventar una fecha. La barra de ocupación usa un gris neutral único y no comunica recomendación, semáforo ni desempeño relativo. Los logos conservan su contenedor blanco uniforme y no se modifica el logo de FMX23.


## Reportes oficiales por FIBRA · actualización 2026-09-17
**Used by**: pestaña `Reportes` de cada perfil. Los reportes enlazan a la fuente oficial y no se re-alojan; los archivos que el administrador ya publicó permanecen separados como `Publicados por ti`.

### Vigentes 2T26
- FUNO11 · Bolsa Mexicana de Valores · https://www.bmv.com.mx/docs-pub/eventfid/eventfid_1577920_1401_1.pdf
- FSHOP13 · Bolsa Mexicana de Valores · https://www.bmv.com.mx/docs-pub/eventfid/eventfid_1575897_f6206_1.pdf
- FIBRAPL14 · Fibra Prologis vía PR Newswire · https://www.prnewswire.com/news-releases/fibra-prologis-anuncia-sus-resultados-financieros-del-segundo-trimestre-de-2026-869554637.html
- FINN13 · Fibra Inn · https://fibrainn.mx/storage/docs/fibra-inn-anuncia-resultados-del-segundo-trimestre-2026.pdf
- FMTY14 · Fibra Mty · https://cdn.investorcloud.net/fibramty/InformacionFinanciera/ReportesTrimestrales/Reportes/2026-2T26-Reporte-en.pdf
- DANHOS13 · Fibra Danhos · https://fibradanhos.com.mx/reportes-trimestrales/pdf/2026/2t26/2T 2026 Español.pdf
- FIBRAMQ12 · Fibra Macquarie · https://www.fibramacquarie.com/assets/fibra/docs/events-and-presentations/2026/fibra-mq-mx-2q26-earnings-release-eng.pdf
- FNOVA17 · Grupo Bafar · https://investorcloud.s3.us-east-1.amazonaws.com/GrupoBAFAR/ReportesTrimestrales/PR-2026-2T26.pdf
- FIBRAUP18 · Actinver · https://actinver.com/documents/d/actinver/fibraup-18-2t-2026
- EDUCA18 · Fibra Educa · https://investorcloud.s3.amazonaws.com/FibraEDUCA/InformacionFinanciera/ReportesTrimestrales/2026_2T26.pdf
- FPLUS16 · Fibra Plus · http://cdn.investorcloud.net/fibraplus/InformacionFinanciera/ReportesTrimestrales/2026-2T26-BMV.pdf
- STORAGE18 · Fibra Storage · https://fibrastorage.com/wp-content/uploads/2026/08/One-Pager-2T26.pdf
- FIHO12 · Bolsa Mexicana de Valores · https://www.bmv.com.mx/docs-pub/eventfid/eventfid_1574632_1596_1.pdf

### Históricos alojados por AMEFIBRA
- FIHO12 · 1T21 · https://amefibra.com/wp-content/uploads/2021/05/FIHOTEL-Press-Release-1Q-2021-ESP-vF.pdf
- STORAGE18 · 1T21 · https://amefibra.com/wp-content/uploads/2021/05/Reporte_Fin_1Q_2021_FIBRA_Storage.pdf
- STORAGE18 · 4T20 · https://amefibra.com/wp-content/uploads/2021/05/FIBRA-Storage_4T20.pdf
- STORAGE18 · 2T20 · https://amefibra.com/wp-content/uploads/2021/05/FIBRA-Storage_2T20.pdf
- STORAGE18 · 1T20 · https://amefibra.com/wp-content/uploads/2021/05/FIBRA-Storage_1T20.pdf
- FNOVA17 · 3T20 · https://amefibra.com/wp-content/uploads/2021/05/FNOVA-3T20.pdf
- FNOVA17 · 1T21 · https://amefibra.com/wp-content/uploads/2021/05/Press-Release-FNova-1T2021-Final.pdf
- DANHOS13 · 2T20 · https://amefibra.com/wp-content/uploads/2021/05/Fibra-Danhos-2T20.pdf
- FMTY14 · 1T21 · https://amefibra.com/wp-content/uploads/2021/05/FMY2021-1T21-Reporte-.pdf
- EDUCA18 · 1T21 · https://amefibra.com/wp-content/uploads/2021/05/Fibra-Educainforme-trimestral-1T2021.pdf
- FSHOP13 · 1T21 · https://amefibra.com/wp-content/uploads/2021/05/Resultados-T1-2021.pdf
- FIBRAPL14 · 4T20 · https://amefibra.com/wp-content/uploads/2021/05/2021-01-27_FIBRA_Prologis_Anuncia_sus_Resultados_Financieros__342.pdf

**Processing**: se muestran tres grupos: `Publicados por ti`, `Reporte vigente` y `Archivo histórico`. Cada enlace lleva periodo y fuente. FCFE18, FHIPO14 y FMX23 no reciben filas nuevas porque no se encontró un PDF verificado en el inventario provisto. Terrafina se omite por estar deslistada.


## Ratios en vivo · Fase 1 (17-sep-2026)
**Used by**: nueva sección principal `Ratios en vivo`, con yield forward y payout recalculados a partir del precio de mercado que ya entrega `getMarketData`.

**Fundamentales suministrados y aprobados en la solicitud actual**:
- FUNO11: distribución 2T26 $0.6398 trimestral; anualizada $2.5592.
- FIHO12: $0.1555 trimestral; anualizada $0.6220; AFFO 2T26 $0.1457 por CBFI; payout 106.7% reportado.
- FINN13: $0.09 trimestral; anualizada $0.3600.
- FMTY14: $0.07592 mensual; anualizada $0.91104; dato distorsionado por el cambio de denominador y un solo mes consolidado desde 29-may-2026.
- FNOVA17: $0.6216 trimestral; anualizada $2.4864.
- FIBRAMQ12: $0.2042 mensual desde jul-2026; anualizada $2.4504.
- EDUCA18: $0.6514 trimestral; anualizada $2.6056.
- FIBRAPL14: $0.7314 trimestral en efectivo; anualizada $2.9256; se excluye del yield cualquier parte en especie.
- STORAGE18: $0.9052 anual, un pago en marzo.
- FCFE18: $0.61883 trimestral; anualizada $2.47532.
- DANHOS13: $0.45 trimestral; anualizada $1.80; cada pago separa resultado fiscal y reembolso de capital.
- FSHOP13 y FMX23: no verificados, sin estimación.
- FPLUS16: 0.00%, distribuciones suspendidas.
- FIBRAUP18: pago único histórico de USD$0.55, no comparable y fuera del ranking.

**Processing**: la migración `0008_add_live_ratios_fundamentals.sql` persiste estos datos en `fibra_distributions`; el cliente calcula primero `yield = distribución anualizada / precio × 100` y después `payout = distribución anualizada / (AFFO trimestral × 4) × 100`, redondea a dos decimales para ordenar y conserva `— NO VERIFICADO` cuando falta un insumo. Solo FIHO12 tiene AFFO verificado. El precio mantiene el canal y caché existentes; la vista solicita nuevos precios cada 30 segundos mientras está abierta. La fecha real de la última cotización se muestra separada del corte 2T26 de los fundamentales. Mercado cerrado desactiva animaciones y conserva la clasificación del último cierre.
