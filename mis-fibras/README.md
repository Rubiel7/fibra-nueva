# Mis FIBRAs — código fuente

App de seguimiento de portafolio de FIBRAs mexicanas (fideicomisos de inversión
en bienes raíces). Registra compras y ventas de CBFIs, distribuciones recibidas,
muestra el valor del portafolio con gráficas, compara tu asignación real contra
tu objetivo y lleva metas de inversión con abonos.

Todo en español. Frontend vanilla (HTML/CSS/JS, sin frameworks ni CDNs externos;
las gráficas se dibujan con SVG puro). Backend con Express y SQLite.

## Requisitos

- Node.js **>= 22.5** (usa `node:sqlite`, integrado en Node; no hay que compilar
  nada nativo). Compruébalo con `node --version`.

## Cómo correrla

```bash
cd mis-fibras-codigo
npm install
node server.js
```

Luego abre en el navegador: **http://localhost:3000**

La base de datos se crea sola al arrancar en `./data/fibras.db`.
Para empezar de cero, detén el servidor y borra ese archivo.

## Estructura

```
mis-fibras-codigo/
├── package.json          # solo dependencia: express
├── server.js             # API REST + sirve ./public
├── public/
│   ├── index.html        # las 4 vistas + navegación inferior
│   ├── styles.css        # fondo claro, letras oscuras, pensado para 390px
│   └── app.js            # lógica del frontend (vanilla JS, SVG puro)
├── data/
│   └── fibras.db         # SQLite, se crea al arrancar
└── README.md
```

## API REST (JSON)

| Método | Ruta | Descripción |
|---|---|---|
| GET/POST | `/api/catalog` | Catálogo de FIBRAs / agregar ticker |
| PUT/DELETE | `/api/catalog/:ticker` | Editar nombre y segmento / eliminar |
| GET/POST | `/api/operations` | Operaciones / registrar operación |
| DELETE | `/api/operations/:id` | Eliminar operación |
| GET | `/api/positions` | Posiciones calculadas en el servidor |
| PUT | `/api/positions/:ticker` | Guardar precio actual manual (`{current_price}`) |
| GET/PUT | `/api/allocations` | Asignación objetivo por FIBRA y umbral de alerta |
| GET | `/api/monthly-series` | Serie de 12 meses (gráficas del Panel) |
| GET | `/api/monthly?month=YYYY-MM` | Resumen del mes (tarjetas del Panel) |
| GET/POST | `/api/goals` | Metas / crear meta |
| DELETE | `/api/goals/:id` | Eliminar meta y sus abonos |
| GET/POST | `/api/goals/:id/contributions` | Abonos de una meta / registrar abono |
| DELETE | `/api/goals/:goalId/contributions/:id` | Eliminar abono |

Tipos de operación: `compra`, `venta`, `distribucion`.
Para compra/venta se usan `cantidad` (CBFIs) y `precio` (por CBFI);
para distribución se usa `monto`.

## Cálculo de posiciones

Por cada FIBRA con operaciones:

- `cbfis = Σ compras − Σ ventas` (si es ≤ 0 la posición se omite)
- `precio_promedio = Σ(cantidad × precio de compras) / Σ cantidad de compras`
- `precio_actual =` el manual guardado, o el promedio si no hay manual
- `valor = cbfis × precio_actual`, `costo = cbfis × precio_promedio`
- `ganancia = valor − costo`, `% del portafolio = valor / valor total`

## Estado inicial

El catálogo se siembra con 12 FIBRAs (FUNO11, DANHOS13, FIBRAMQ12, FIBRAPL14,
FIBRAUP18, FIHO12, FINN13, FMTY14, FPLUS16, FSHOP13, STORAGE18, EDUCA18).
Todo lo demás —operaciones, metas, abonos, precios, asignaciones— inicia vacío.
No hay datos de ejemplo.
