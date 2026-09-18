# Guía de contribución — FibrasMX

Guía para quien (o lo que) trabaje en el código: convenciones del proyecto, estructura, compilación, migraciones y decisiones de diseño.

## Estructura del repositorio

- `client/` — aplicación React (frontend).
- `server/src/actions.ts` — acciones del servidor (la única vía para leer y modificar datos de la app).
- `server/src/schema.ts` — esquema de datos de la aplicación.
- `drizzle/` — migraciones SQL generadas con Drizzle (mantienen el esquema sincronizado con la base de datos).
- La configuración del espacio (runtime y slug) vive en `space.json`.

## Compilación y despliegue

- No edites a mano el paquete compilado (el directorio de build generado): es un artefacto de salida, no código fuente.
- La construcción, auditoría y publicación se hacen exclusivamente mediante el flujo oficial de publicación del proyecto (planificar → compilar → auditar → enviar). Compilar localmente por tu cuenta no publica el artefacto.
- Si llegaste a este código como lector o coordinador (no como responsable de la compilación), no compiles desde aquí: pide el cambio describiendo la edición y deja que el encargado de compilación lo ejecute.

## Datos

- Los datos de la aplicación viven en `app.db`, gestionada por la propia app.
- Para inspeccionar o modificar datos: usa las acciones de la app o solicita una edición del artefacto. Nunca abras `app.db` directamente con SQLite ni con scripts externos.

## Migraciones

- Cualquier cambio al esquema de datos se gestiona con migraciones de Drizzle en `drizzle/`.
- Usa los comandos oficiales de esquema/migración de la plataforma (se mantienen actualizados en la documentación del constructor de artefactos); no escribas SQL a mano contra la base de datos de producción.

## Reglas de estilo

- Todo el código está en TypeScript; el frontend es React.
- El esquema de datos es la única fuente de verdad: `server/src/schema.ts` define la forma de los datos y las migraciones la reflejan.
- Toda lectura o escritura de datos pasa por las acciones del servidor en `server/src/actions.ts`; no hay accesos directos a la base de datos desde el cliente.

## Decisiones de diseño importantes

- **Arquitectura cliente/servidor separada**: el frontend (React) nunca toca la base de datos; el servidor expone acciones tipadas que son el único punto de entrada a los datos.
- **Migraciones versionadas**: los cambios de esquema viajan con el código en `drizzle/`, de modo que cada compilación sabe exactamente qué versión del esquema necesita.
- **Artefacto reproducible**: la publicación sigue un flujo determinista (planificar, compilar, auditar, enviar); el directorio de build generado nunca se edita a mano, lo que garantiza que lo publicado siempre corresponde al código fuente.
- **Datos gestionados por la app**: la base de datos es propiedad de la aplicación en ejecución, no del desarrollador; esto evita corrupciones por accesos concurrentes fuera del proceso oficial.
