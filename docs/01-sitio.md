# FibrasMX: qué es el sitio

## Descripción

FibrasMX es una aplicación web en español sobre las FIBRAs mexicanas (fideicomisos de inversión en bienes raíces): su catálogo, sus cotizaciones, sus distribuciones y sus datos fundamentales. La interfaz tiene una identidad visual oscura con acento rojo, logotipos locales de cada emisora y está pensada para consultarse desde el teléfono.

El sitio combina tres cosas: **datos de mercado** (precios y variaciones), **datos fundamentales** (yields, frecuencias de pago, distribuciones) y **contenido publicado por el dueño** (videos y reportes en PDF organizados por FIBRA). Todo el contenido personal —favoritos, alertas, portafolio— funciona por sesión de navegador; no hay muro de registro para usar el sitio.

## Módulos

### Mercado
Tarjetas con cada FIBRA: logotipo, precio actual, variación de la sesión y botón de favorito. Abre el perfil detallado de cada emisora. Incluye la ficha histórica "Deslistada" de TERRA13, que se muestra solo como referencia, nunca como cotización operable.

### Ratios en vivo
Vista de fundamentales en vivo por FIBRA: yield anualizado, frecuencia de pago, última distribución, AFFO trimestral por CBFI y una marca de calidad del dato (verificado, sin verificar, sin distribuciones). Los datos se refrescan periódicamente.

### Precios en vivo
Las cotizaciones de mercado se obtienen desde la capa de datos administrados con un caché persistente de unos 5 minutos. Si una cotización falla, el sitio muestra un hueco honesto con la fuente y la fecha de la última referencia disponible, en lugar de inventar un número.

### Laboratorio SA-TAFE
Sección cuantitativa aparte, alimentada por el modelo SA-TAFE (Threshold Accepting Forecasting Ensemble). Muestra por emisora la señal del modelo, el rendimiento esperado a 26 semanas, la varianza, el rango de la señal y una cartera sugerida por el modelo. Los datos vienen de una corrida semanal guardada en la base de datos: actualizar el Laboratorio es insertar una fila nueva, no reconstruir el sitio.

### Mis FIBRAs (Portafolio)
Portafolio personal por sesión, con cinco pestañas:

- **Panel**: valor actual, costo invertido y ganancia/pérdida total.
- **Operaciones**: registro de compras, ventas y distribuciones recibidas, con historial y eliminación con confirmación.
- **Asignación**: posiciones con precio manual opcional, porcentaje objetivo por FIBRA y umbral de desviación configurable (alerta si la desviación lo supera).
- **Metas**: metas de inversión en pesos con abonos registrados y progreso.
- **Catálogo**: las mismas emisoras y cotizaciones del mercado.

### Reportes
Biblioteca de reportes en PDF por FIBRA, clasificados por año y periodo (Anual, T1–T4). El dueño los sube desde la sección Publicar.

### Videos
Galería de videos de YouTube y Vimeo publicados por el dueño, filtrable por FIBRA y por categoría (Guía, Fichas, Análisis, Noticias). Los videos se incrustan con el endpoint oficial de cada proveedor y degradan a enlace visible si el reproductor está bloqueado.

### Favoritos
Estrella por FIBRA para marcar las favoritas; el estado se guarda por sesión de navegador.

### Alertas
Alarmas de precio por FIBRA y por sesión: precio objetivo con dirección "arriba de" o "abajo de".

### Próximos pagos
Calendario de distribuciones por mes: pagos confirmados (con fecha ex-derecho y fecha de pago) y proyecciones estimadas con nivel de confianza (alta, media, baja). Los montos estimados se marcan como expectativas, no como promesas.

### Publicar
Centro de publicación del dueño con dos flujos:

- **Video**: título, enlace de YouTube o Vimeo, FIBRA, categoría y descripción opcional.
- **Reporte**: título, FIBRA, año, periodo y archivo PDF (se sube como base64 y se guarda en el almacén de archivos).

### Comparador
Hasta 3 FIBRAs lado a lado con yield anual, frecuencia, mínimo/máximo del día, rango de 52 semanas y línea de fuente de la cotización.

### Calculadora
Simulador de interés compuesto a 5 años: inversión inicial, rendimiento anual y número de años, con valor proyectado y ganancia estimada. Declara que es una simulación matemática, no una promesa de rendimiento.

### Perfil por FIBRA
Vista de detalle con seis pestañas:

- **Resumen**: precio, gráfica histórica de precio (30 días, 90 días, 1 año, 5 años) y contexto de operaciones.
- **Pagos**: última distribución, total distribuido en 12 meses, yield anualizado, frecuencia e historial de distribuciones, con nota de que los pagos pasados no garantizan futuros.
- **Valuación**: cotización, variación de la sesión, mínimos y máximos de 52 semanas, con recordatorio de que un yield alto por sí solo no determina conveniencia.
- **Ocupación**: datos de ocupación por emisora.
- **Videos**: videos publicados para esa FIBRA.
- **Reportes**: reportes en PDF para esa FIBRA.

Cada ficha de emisora tiene un bloque informativo que pide confirmar fechas y montos en los reportes oficiales de la FIBRA.

## Cómo está organizado el código

El proyecto es un artefacto web TypeScript con tres piezas principales:

### `client/` — la interfaz
Aplicación React de una sola página, en español:

- El archivo principal de vistas contiene Mercado, Ratios en vivo, Próximos pagos, Videos, Publicar, Herramientas (comparador y calculadora), Portafolio, el perfil por FIBRA y los componentes compartidos (tarjetas, gráficas, formularios).
- Un archivo separado contiene el Laboratorio SA-TAFE, que lee la corrida más reciente desde la base de datos y la presenta sin lógica de cálculo en el cliente.
- Un cliente RPC tipado expone todas las acciones del servidor; los tipos fluyen del servidor al cliente sin generación de código.
- Hoja de estilos con la identidad oscura/roja, punto de entrada de la app y los logotipos de cada FIBRA en dos tamaños (miniatura y visualización).

### `server/` — las acciones y los datos
- **Acciones**: todas las operaciones expuestas al cliente como RPC tipado: datos de mercado, ratios, detalle por FIBRA, historial, videos, reportes, favoritos, alertas, portafolio completo (operaciones, metas, asignación), corrida SA-TAFE y cuentas de usuario. Las cotizaciones viven en caché con tiempos de vida cortos (mercado e históricos por minutos, modelo SA-TAFE por más tiempo).
- **Esquema**: definición de las tablas SQLite: videos, reportes, favoritos, alertas, portafolio y sus operaciones, preferencias de asignación, metas y abonos, caché de cotizaciones, distribuciones y fundamentales por FIBRA, usuarios y sesiones de autenticación, y corridas semanales del modelo SA-TAFE.
- **Autenticación**: sistema de cuentas con correo y contraseña preparado en el servidor, con dos roles (administrador y usuario), pero desactivado en la interfaz: la UI sigue usando sesiones anónimas.
- **Históricos**: módulo que obtiene series de precios diarios desde un proveedor externo de finanzas para la gráfica histórica.

### `drizzle/` — las migraciones
Historial ordenado de migraciones SQL que crea y evoluciona la base de datos: tablas de videos y reportes, metadatos de contenido y propietarios, cuentas de autenticación, roles, seguimiento de portafolio personal, migraciones de posiciones heredadas, ratios en vivo y fundamentales, y corridas del modelo SA-TAFE.

## Notas de comportamiento

- La personalización es por **sesión de navegador anónima**: favoritos, alertas y portafolio no requieren cuenta.
- La cuenta de administrador solo puede crearse por el propietario verificado del artefacto; la interfaz de inicio de sesión no está activada.
- Cuando un dato no puede verificarse (precio, monto de distribución, señal del modelo), el sitio lo dice explícitamente: muestra la fuente, la fecha y el nivel de confianza en lugar de ocultar el hueco.
- Los videos y reportes son contenido del dueño: el público solo los ve en la galería y en los perfiles; la publicación está en la sección Publicar.
