# Integración del Laboratorio SA-TAFE en el sitio FibrasMX

## Qué es el Laboratorio cuantitativo SA-TAFE

El Laboratorio cuantitativo SA-TAFE es una pestaña del sitio (la pestaña
"Laboratorio") que publica los resultados de un análisis cuantitativo sobre el
mercado de FIBRAs mexicanas: una calificación de riesgo-retorno por emisora,
una cartera modelo con sus métricas agregadas y una nota metodológica sobre
cómo se obtuvo el resultado.

El diseño de la sección sigue la regla del proyecto para esta vista: fondo
claro con letras negras, insignias en tonos neutros (sin colores de compra o
venta), un bloque colapsable "¿Cómo funciona?" que incluye la cita del paper
académico de referencia y las limitaciones del modelo, y un disclaimer visible.
La sección no tiene animaciones y respeta la preferencia de movimiento reducido
del usuario.

## Arquitectura de datos: la tabla `sa_tafe_runs`

Todos los datos del Laboratorio viven en un solo lugar: la tabla
`sa_tafe_runs`. Sus columnas son:

| Columna | Propósito |
|---|---|
| `run_date` | Fecha de la corrida (única; es la clave de cada análisis) |
| `price_cutoff` | Fecha de corte de los precios usados en la corrida |
| `horizon_weeks` | Horizonte del análisis, en semanas |
| `payload_json` | Resultado completo de la corrida en formato JSON |
| `created_at` | Fecha de registro de la fila |

El frontend no lee archivos estáticos: consulta la base de datos y muestra la
fila más reciente.

## La migración que crea y siembra la tabla

La migración `0009_add_sa_tafe_runs.sql` cumple dos funciones en un solo paso:

1. **Crea la tabla** `sa_tafe_runs` con la estructura descrita arriba
   (`run_date` único).
2. **Siembra la corrida del 17 de septiembre de 2026**: inserta el resultado
   completo en `payload_json`, con 16 tickers, incluyendo NEXT25 marcado como
   SIN_DATOS.

De esta forma, el Laboratorio llega funcionando desde el primer despliegue: la
migración ya deja los datos listos y no hay que cargarlos por separado.

## Acciones del servidor

Hay dos acciones, una de lectura y una de escritura:

- **`getSaTafeLatest` (lectura)** — Devuelve la fila con el `run_date` más
  reciente. Es la que usa la vista del Laboratorio para obtener los datos que
  muestra.
- **`saveSaTafeRun` (escritura)** — Guarda una corrida con upsert por
  `run_date`: si ya existe una fila con esa fecha, la actualiza; si no, la
  crea. **No está expuesta en la interfaz**: no hay formulario ni botón que la
  invoque. La utiliza el proceso de actualización semanal para escribir los
  datos nuevos.

## Archivos del paquete de integración y dónde van

| Archivo del paquete | Destino en el proyecto |
|---|---|
| `SaTafeLab.tsx` | Nueva vista en el cliente (`client/src/SaTafeLab.tsx`) |
| `sa-tafe-lab.css` | Contenido agregado al final del archivo de estilos del tema (`theme.css`) |
| `schema-snippet.ts` | Contenido agregado al final del esquema de la base de datos (`schema.ts`) |
| `actions-snippet.ts` | Las dos acciones (`getSaTafeLatest`, `saveSaTafeRun`) agregadas en el archivo de acciones del servidor (`actions.ts`), después de la acción de ratios en vivo |
| `0009_add_sa_tafe_runs.sql` | Nueva migración registrada en la carpeta de migraciones (`drizzle/`) |

La integración en la aplicación principal requiere cuatro ediciones:

- Agregar `"laboratorio"` al tipo de vistas disponibles.
- Importar el componente `SaTafeLabView` junto a los demás imports.
- Agregar la entrada `['laboratorio','Laboratorio']` a la navegación y ampliar
  la cuadrícula de navegación de 7 a 8 columnas (en móvil se ajusta solo con el
  CSS existente).
- Renderizar `<SaTafeLabView/>` cuando la vista activa sea `"laboratorio"`.

Ninguna vista existente se toca (Mercado, Ratios en vivo, precios en vivo, Mis
FIBRAs, Reportes, Videos, Favoritos, Alertas, Próximos pagos).

## Qué verificar después de la integración

- La pestaña "Laboratorio" abre la sección clara.
- El encabezado indica la fecha de actualización, el corte de precios y la
  frecuencia de la próxima corrida ("cada lunes").
- La tabla muestra 15 FIBRAs y la fila NEXT25 marcada como NO VERIFICADO (sin
  números).
- La tarjeta del portafolio muestra el retorno y la varianza de la corrida.
- El bloque "¿Cómo funciona?" es colapsable e incluye la cita del paper y las
  limitaciones.
- El disclaimer es visible y las insignias son neutras.
- Todo lo demás sigue funcionando sin errores.

## Flujo de actualización semanal (sin rebuild)

Actualizar los datos cada lunes **no requiere un nuevo build ni tocar código**.
El flujo es solo de datos:

1. Se genera la nueva corrida del análisis cuantitativo.
2. El proceso semanal invoca la acción `saveSaTafeRun` con el `run_date` de la
   nueva corrida, lo que inserta una fila nueva en `sa_tafe_runs` (o actualiza
   la existente si se re-ejecuta la misma fecha).
3. La vista del Laboratorio consulta `getSaTafeLatest`, que devuelve
   automáticamente la corrida más reciente.

Mientras los datos se actualicen cada lunes, el sitio siempre muestra el último
análisis sin que nadie tenga que redesplegar.
