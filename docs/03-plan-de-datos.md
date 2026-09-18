# Plan de datos — FibrasMX unificado

## De dónde vienen los datos

El sitio combina cuatro familias de datos, cada una con su origen y su propio
ritmo de actualización:

1. **Precios en vivo (mercado).** Las cotizaciones llegan desde un proveedor
   de datos de mercado mediante su buscador de símbolos, usando símbolos del
   mercado mexicano (por ejemplo `FUNO11.MX`, `FIBRAPL14.MX`). Cuando una
   cotización trae serie histórica, se usa directamente; si no, la serie de
   30 días se consulta a Yahoo Finance. La gráfica de precio histórico se
   alimenta de esa serie diaria.
2. **Datos de SQLite.** La base de datos local del sitio se gestiona con el
   esquema de la aplicación y sus migraciones versionadas. Guardan todo lo
   que genera el usuario (videos publicados, reportes subidos, favoritos,
   alertas y posiciones de portafolio) más los fundamentales sembrados por
   migraciones (distribuciones, ocupación, métricas).
3. **Datos sembrados por migraciones.** Cifras curatoradas y verificadas que
   se cargan una sola vez mediante migraciones SQL: el historial de
   distribuciones de los últimos 2 años, los fundamentales que alimentan la
   sección “Ratios en vivo” (distribución anualizada y AFFO), y las cifras
   de ocupación y número de propiedades del corte 2T26.
4. **Datos estáticos del catálogo.** Nombre, nombre legal, ticker, segmento
   y logotipos de las 16 FIBRAs. Los logotipos viven como archivos locales
   copiados dentro del proyecto; el sitio no carga imágenes de logos desde
   servidores remotos.

Los documentos de una FIBRA no se re-alojan: la pestaña Reportes enlaza a la
fuente oficial (BMV, AMEFIBRA o el sitio de la emisora). Solo los PDF que el
administrador sube él mismo se guardan como archivos binarios del
almacenamiento interno del sitio, y en la base de datos solo quedan sus
metadatos y su clave de acceso.

## Qué tablas existen y para qué sirve cada una

- **Distribuciones (`fibra_distributions`).** Sembrada por migraciones. Guarda
  la distribución verificada por FIBRA (monto por periodo, periodicidad,
  monto anualizado y, cuando existe, el AFFO por CBFI). Es la base de los
  ratios en vivo: con la distribución anualizada y el precio actual se
  calcula el *yield forward*; con el AFFO verificado se calcula el
  *payout*. Solo FIHO12 tiene AFFO verificado; donde falta un insumo, la
  interfaz muestra “NO VERIFICADO” en lugar de inventar un número.
- **Fundamentales de ocupación y propiedades.** Cifras del corte 2T26 por
  FIBRA, sembradas por migración. Alimentan la “ficha rápida” y la pestaña
  de Ocupación de cada perfil. Cada métrica conserva su referencia de
  captura (fuente y fecha) y se muestra literalmente como fue reportada;
  las FIBRAs que no son portafolios inmobiliarios comparables (FHIPO14,
  FCFE18, FMX23) se marcan “no aplica (2T26)” con su explicación.
- **Videos.** Crece con cada publicación del administrador: proveedor
  (YouTube o Vimeo), identificador del video y enlace original. Solo se
  aceptan enlaces válidos de esas dos plataformas; la reproducción usa el
  reproductor embebido oficial y, si el iframe está bloqueado, se degrada a
  un enlace visible. La galería y la pestaña Videos los ordenan del más
  reciente al más antiguo.
- **Reportes publicados.** Metadatos de los PDF que el administrador sube
  (título, periodo, año editorial, clave del archivo). Los binarios viven en
  el almacenamiento de archivos del sitio, no en la base de datos. En la
  pestaña Reportes conviven tres grupos: los publicados por el
  administrador, el reporte vigente de la emisora (enlace a la fuente
  oficial) y el archivo histórico.
- **Favoritos, alertas y portafolio.** Tablas que crecen con las acciones del
  usuario: qué FIBRAs marca como favoritas, qué alertas configura y qué
  posiciones registra en su portafolio. Son el estado personal de quien usa
  el sitio.
- **Señal SA-TAFE.** Fuente auxiliar de clasificación
  (COMPRAR / MANTENER / VENDER) por FIBRA. El archivo original contiene
  valores no numéricos (`NaN`) que se convierten a nulos antes de
  interpretarlo, y los alias de tickers se normalizan (por ejemplo
  `SHOP13` → `FSHOP13`). Si una FIBRA no tiene entrada, se muestra “Sin
  señal SA-TAFE” en lugar de suponerla.
- **Ficha histórica TERRA13.** Terrafina permanece en el catálogo como ficha
  histórica marcada “Deslistada”; nunca aparece como una cotización operable.

## Ciclo de actualización de datos

No hay tareas programadas ni sincronización automática: el sitio no corre
ningún cron ni escucha eventos externos. La actualización ocurre a demanda,
con estas reglas:

- **Cotizaciones:** se solicitan al abrir la vista y se reutilizan durante
  5 minutos gracias a una caché persistente; la vista de “Ratios en vivo”
  pide precios nuevos cada 30 segundos mientras está abierta. Cada
  cotización conserva su marca temporal original y la interfaz muestra la
  fecha real de la última cotización por separado del corte 2T26 de los
  fundamentales. Cuando el mercado está cerrado, las animaciones se
  desactivan y se conserva la clasificación del último cierre.
- **Histórico de precios:** serie de 30 días con cierre diario, consultada
  solo cuando la cotización no incluye sus propios puntos; también usa la
  caché de 5 minutos.
- **Señal SA-TAFE:** se refresca con una caché de 10 minutos.
- **Contenido del usuario:** videos, reportes, favoritos, alertas y
  posiciones se crean o cambian únicamente cuando el usuario actúa; no
  expiran ni se regeneran solos.
- **Datos sembrados:** distribuciones, fundamentales de ocupación y catálogo
  son estáticos hasta que una nueva migración los actualice con cifras
  verificadas.

## Reglas de honestidad con los datos

- Si un símbolo no devuelve cotización, se muestra el hueco tal cual en
  lugar de rellenarlo.
- Las distribuciones conservan su orden cronológico y sus montos por CBFI
  exactamente como fueron reportados; la predictibilidad describe la
  regularidad histórica y no es una recomendación ni una promesa de pago
  futuro.
- Cuando la evidencia es parcial (por ejemplo, solo el último monto
  verificable de una serie, o ningún historial verificado), la interfaz lo
  declara explícitamente en vez de estimarlo.
- Las fechas guardadas como instantes se presentan en la hora local de
  quien visita; el año y periodo de un reporte son campos editoriales
  escritos por el administrador, no tiempos inferidos.
- La barra de ocupación usa un gris neutral único: no comunica
  recomendación ni desempeño relativo.
