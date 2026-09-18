# Sistema de autenticación

## Estado actual

El sistema de cuentas está **construido, pero no activado en la interfaz**.

Existe una base funcional de cuentas con correo electrónico y contraseña, guardada en la base de datos con las tablas `users` y `auth_sessions`. Sin embargo, la aplicación sigue operando en modo anónimo de forma deliberada: no hay pantalla de login, no hay muro de registro, los favoritos funcionan sin cuenta, los precios en vivo no cambian y el flujo de publicación existente sigue disponible exactamente igual que antes.

**La activación del login está pendiente de la decisión del dueño.** Todo lo descrito en este documento existe en el servidor; nada de ello es visible para el usuario hasta que se apruebe su activación.

## Los dos roles

El sistema contempla dos roles separados, con accesos y pantallas distintas:

- **Administrador**: reservado para la administración del sitio. La primera cuenta de administrador solo puede crearse una vez, a través de un proceso especial de arranque que verifica la identidad del propietario. Una vez autenticado, un administrador puede cambiar el rol de otra cuenta.
- **Usuario**: el rol que se asigna a todo registro público. Está pensado para que los visitantes sincronicen sus favoritos, alertas y portafolio entre dispositivos.

Un registro público nunca puede elegirse a sí mismo el rol de administrador.

## Cómo funciona a nivel general

1. El visitante se registra con correo electrónico, nombre visible y contraseña, o inicia sesión con sus credenciales. El registro público siempre crea cuentas de rol usuario.
2. Al iniciar sesión con éxito, el servidor devuelve un token de sesión que el cliente guarda en almacenamiento protegido.
3. Cada sesión de autenticación queda registrada en la tabla `auth_sessions` con su caducidad.
4. Las acciones autenticadas (favoritos, alertas, portafolio) resuelven la cuenta a partir del token; el navegador nunca maneja identificadores de usuario como mecanismo de autorización.
5. Al crear su cuenta por primera vez, el visitante puede migrar lo que tenía guardado en modo anónimo (favoritos, alertas y portafolio del navegador) hacia su cuenta autenticada.

## Modelo de seguridad

- Las contraseñas se almacenan con un hash robusto (Argon2id); la contraseña en texto plano nunca se guarda.
- Los tokens de sesión tienen 256 bits de aleatoriedad; en la base de datos solo se conservan los hashes de esos tokens.
- Las sesiones caducan a los 30 días y pueden cerrarse explícitamente.
- Cinco intentos fallidos de inicio de sesión bloquean la cuenta durante 15 minutos.
- Los mensajes de error de login son genéricos, y el camino de "cuenta inexistente" ejecuta un cálculo costoso para dificultar que alguien averigüe qué correos están registrados analizando tiempos de respuesta.
- Las comprobaciones de rol se hacen en el servidor a partir del token autenticado; nunca se confía en datos que vengan del cliente.

## Acciones disponibles en el servidor

**Cuentas de visitante:**

- `registerAccount({ email, displayName, password })` — siempre crea rol `user`
- `loginAccount({ email, password })`
- `getAuthSession({ token })`
- `logoutAccount({ token })`
- `claimAnonymousWorkspace({ token, anonymousSessionId })` — migra favoritos, alertas y portafolio del modo anónimo a la cuenta

**Administración:**

- `bootstrapAdminAccount({ email, displayName, password })` — solo el propietario, una sola vez
- `setAccountRole({ token, userId, role })` — solo administradores autenticados

## Notas para la activación

Cuando el dueño apruebe la activación de las experiencias de login:

1. Se agregará una pantalla de registro/inicio de sesión para visitantes y un punto de entrada separado para el administrador; no se mezclarán sus destinos.
2. El token devuelto se guardará en almacenamiento protegido del cliente.
3. Al crear la cuenta o iniciar sesión por primera vez, se migrará el espacio de trabajo anónimo del navegador a la cuenta autenticada.
4. Las acciones autenticadas resolverán la cuenta a partir del token, sin exponer identificadores de usuario al navegador como mecanismo de autorización.
5. Las acciones de administración se protegerán en el servidor por `role === "admin"`, no solo ocultando botones.
6. El restablecimiento de contraseña por correo se agregará únicamente después de elegir un proveedor de correo transaccional; no hay un flujo provisional incluido, porque un enlace de recuperación que no se entrega sería engañoso.
