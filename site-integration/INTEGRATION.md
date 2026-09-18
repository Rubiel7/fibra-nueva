# Integración del "Laboratorio cuantitativo" en fibrasmx-2

Paquete listo para aplicar por el builder del artefacto web (plan → build → audit → submit).
No requiere diseñar nada: todo el código está escrito y los datos ya vienen sembrados
en la migración. No toca nada existente (Mercado, Ratios en vivo, precios en vivo,
Mis FIBRAs, Reportes, Videos, Favoritos, Alertas, Próximos pagos).

## Archivos del paquete (esta carpeta)

| Archivo | Destino en el artefacto |
|---|---|
| `SaTafeLab.tsx` | `client/src/SaTafeLab.tsx` (nuevo) |
| `sa-tafe-lab.css` | agregar su contenido al final de `client/src/theme.css` |
| `schema-snippet.ts` | agregar su contenido al final de `server/src/schema.ts` |
| `actions-snippet.ts` | agregar las 2 acciones en `server/src/actions.ts` (ver paso 4) |
| `0009_add_sa_tafe_runs.sql` | `drizzle/0009_add_sa_tafe_runs.sql` (nueva migración) |

## Arquitectura de datos (un solo lugar)

- Tabla `sa_tafe_runs` (`run_date` único, `price_cutoff`, `horizon_weeks`, `payload_json`, `created_at`).
- La migración 0009 crea la tabla **y siembra la corrida 2026-09-17** (JSON completo
  de `sa-tafe/results/sa-tafe-latest.json` embebido; 16 tickers incl. NEXT25 SIN_DATOS).
- Acción de lectura `getSaTafeLatest` → devuelve la fila con `run_date` más reciente.
- Acción de escritura `saveSaTafeRun` → **upsert por `run_date`**. La usa el job semanal
  vía `artifact.invoke_action`; **no se expone en la UI** (sin formulario ni botón).
- Actualizar datos cada lunes = insertar una fila nueva. **Sin rebuild, sin tocar código.**

## Pasos del builder

1. Copiar `SaTafeLab.tsx` → `client/src/SaTafeLab.tsx`.
2. Agregar el contenido de `sa-tafe-lab.css` al final de `client/src/theme.css`.
3. Agregar el contenido de `schema-snippet.ts` al final de `server/src/schema.ts`
   (`uniqueIndex` ya está importado en ese archivo).
4. En `server/src/actions.ts`, después de la acción `getLiveRatios`, agregar las dos
   acciones de `actions-snippet.ts` (`getSaTafeLatest`, `saveSaTafeRun`).
   `defineAction`, `z`, `desc` y `schema` ya están importados/usados en ese archivo.
5. Copiar `0009_add_sa_tafe_runs.sql` → `drizzle/0009_add_sa_tafe_runs.sql` y registrarla
   con las herramientas de migración del builder (drizzle/meta).
6. En `client/src/App.tsx`, 4 ediciones exactas:
   - a) Tipo de vista:
     `type View="mercado"|"ratios"|"pagos"|"videos"|"publicar"|"herramientas"|"portafolio"|"perfil";`
     → agregar `"laboratorio"`: `...|"portafolio"|"laboratorio"|"perfil";`
   - b) Import (junto a los otros imports):
     `import { SaTafeLabView } from "./SaTafeLab";`
   - c) Nav (después de `['ratios','Ratios en vivo'],`):
     agregar `['laboratorio','Laboratorio'],`
     y cambiar `grid-cols-7` → `grid-cols-8` en el `className` del `<nav>`.
     (En móvil el CSS `.mobile-nav` ya lo vuelve de 4 columnas: queda en 2 filas.)
   - d) Render (después de la línea de `LiveRatiosView`):
     `{view==="laboratorio"&&<SaTafeLabView/>}`
     (sin gate de `market.data`: sus datos vienen de su propia query, como "Próximos pagos").
7. Build → audit → submit según el flujo del builder. Verificar en el audit:
   - La pestaña "Laboratorio" abre la sección clara (fondo blanco, letras negras).
   - Encabezado exacto: "Actualizado: 17 de septiembre de 2026 · Corte de precios: 17-sep-2026 · Próxima corrida: cada lunes".
   - Tabla con 15 FIBRAs + fila NEXT25 como NO VERIFICADO (sin números).
   - Tarjeta del portafolio: +3.13% y varianza 0.000146.
   - Bloque "¿Cómo funciona?" colapsable, cita del paper y limitaciones.
   - Disclaimer visible. Badges neutros (sin verde/rojo).
   - Nada existente roto: navegar por Mercado, Ratios en vivo, Próximos pagos, Videos,
     Publicar, Calcular y Mis FIBRAs sin errores.
   - `prefers-reduced-motion`: la sección no tiene animaciones.

## Actualización semanal (para el job de los lunes)

Ver `../README.md`, sección "Actualización semanal en el sitio".
