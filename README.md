# fibra-nueva

Todo el código del proyecto FibrasMX en un solo lugar.

## Contenido

- `/sa-tafe` — Motor de pronóstico semanal SA-TAFE para las 16 FIBRAs del sitio,
  con su corrida semanal automatizada.
- `/app-ingeniero` — Código base de la app de fibras. Desarrollado por
  inmerzorrilla como trabajo encargado por Rubiel Valencia; se incluye aquí
  como referencia conservando su autoría.
- `/sitio-fibrasmx` — El sitio web FibrasMX en código: precios en vivo, perfiles
  por FIBRA, comparador, calculadora, portafolio, favoritos, alertas y el centro
  Publicar (videos y reportes PDF por fibra).
- `/mis-fibras` — Borrador de la app "Mis FIBRAs".

## Notas

- No se suben librerías (`node_modules`), archivos compilados ni bases de datos
  locales: cada carpeta se instala y se corre por su cuenta (ver su README).
- El archivo `.env` del código del ingeniero no se incluye por seguridad.
