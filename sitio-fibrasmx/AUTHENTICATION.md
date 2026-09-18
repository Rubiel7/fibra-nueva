# Account system (prepared, not enabled in the UI)

The server contains a real email/password account foundation with two separate roles. The current client deliberately remains on its anonymous browser-session behavior until the login experience is approved and activated: there is no login wall, stars still work without registration, live prices are unchanged, and the existing publishing flow remains available exactly as before.

## Roles

- `admin`: reserved for site administration. The first admin can only be created through `bootstrapAdminAccount` while the caller is the verified Muse artifact owner. An authenticated admin may later change another account's role with `setAccountRole`.
- `user`: the only role assigned by public `registerAccount`. Intended for visitor favorites, alerts, and portfolio sync across devices.

A public registration request cannot choose or self-assign the `admin` role.

## Security model

- Passwords are hashed with Bun's Argon2id implementation in the privileged server bundle; plaintext passwords are never persisted.
- Login tokens contain 256 bits of randomness. Only SHA-256 token hashes are stored in the database.
- Sessions expire after 30 days and can be revoked with `logoutAccount`.
- Five failed login attempts lock an account for 15 minutes.
- Login failures use generic copy and the missing-account path performs an expensive password hash to reduce timing-based account discovery.
- Role checks are performed server-side from the authenticated token, never trusted from client input.

## Available actions

### Visitor accounts

- `registerAccount({ email, displayName, password })` — always creates `role: "user"`
- `loginAccount({ email, password })`
- `getAuthSession({ token })`
- `logoutAccount({ token })`
- `claimAnonymousWorkspace({ token, anonymousSessionId })`

### Administration

- `bootstrapAdminAccount({ email, displayName, password })` — owner-only, once
- `setAccountRole({ token, userId, role })` — authenticated admin only

`claimAnonymousWorkspace` moves the current browser's favorites, alerts, and portfolio to the authenticated account key. The account key contains a colon and is intentionally rejected by the existing anonymous-session validator, so an anonymous caller cannot retrieve it by guessing a user ID.

## Activation notes

When the two login experiences are approved:

1. Add a visitor sign-in/register screen and a separate administrator entry point; do not mix their destinations.
2. Store the returned token in protected client storage for this artifact.
3. On visitor account creation or first login, call `claimAnonymousWorkspace` with the current `fibrasmx-session` value.
4. Add authenticated workspace actions that resolve the account key from the token; do not send or expose `user:<id>` to the browser as an authorization mechanism.
5. Gate administration actions by `role === "admin"` on the server, not by hiding buttons alone.
6. Add an email-based password-reset flow only after a transactional email provider is selected. No reset stub is included because a non-delivering reset link would be misleading.
