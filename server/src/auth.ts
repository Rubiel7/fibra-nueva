import type { Ctx } from "@hatch/space-sdk";
import { eq } from "drizzle-orm";
import * as schema from "./schema";
import { privileged } from "@space/privileged";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

export type AccountRole = "admin" | "user";

export type AuthenticatedUser = {
  id: string;
  email: string;
  displayName: string;
  role: AccountRole;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLocaleLowerCase("en-US");
}

function createToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(ctx: Ctx, password: string): Promise<string> {
  const result = await ctx.executePrivileged(privileged.hashPassword, { password });
  return result.passwordHash;
}

export async function verifyPassword(ctx: Ctx, password: string, passwordHash: string): Promise<boolean> {
  const result = await ctx.executePrivileged(privileged.verifyPassword, { password, passwordHash });
  return result.valid;
}

export async function createAuthSession(ctx: Ctx, userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = ctx.db<typeof schema>();
  const token = createToken();
  const tokenHash = await sha256(token);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(schema.authSessions).values({
    id: crypto.randomUUID(),
    userId,
    tokenHash,
    expiresAt,
    createdAt: now,
    lastUsedAt: now,
  });
  return { token, expiresAt };
}

export async function authenticateToken(ctx: Ctx, token: string): Promise<AuthenticatedUser | null> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return null;
  const db = ctx.db<typeof schema>();
  const tokenHash = await sha256(token);
  const session = (await db.select().from(schema.authSessions).where(eq(schema.authSessions.tokenHash, tokenHash)).limit(1))[0];
  if (!session) return null;
  const now = new Date();
  if (session.expiresAt.getTime() <= now.getTime()) {
    await db.delete(schema.authSessions).where(eq(schema.authSessions.id, session.id));
    return null;
  }
  const user = (await db.select().from(schema.users).where(eq(schema.users.id, session.userId)).limit(1))[0];
  if (!user || user.status !== "active") return null;
  await db.update(schema.authSessions).set({ lastUsedAt: now }).where(eq(schema.authSessions.id, session.id));
  return { id: user.id, email: user.email, displayName: user.displayName, role: user.role };
}

export async function revokeAuthSession(ctx: Ctx, token: string): Promise<void> {
  if (!/^[a-f0-9]{64}$/i.test(token)) return;
  const tokenHash = await sha256(token);
  await ctx.db<typeof schema>().delete(schema.authSessions).where(eq(schema.authSessions.tokenHash, tokenHash));
}

export async function registerAccount(ctx: Ctx, args: { email: string; displayName: string; password: string }, role: AccountRole = "user"): Promise<{ user: AuthenticatedUser; token: string; expiresAt: Date }> {
  const db = ctx.db<typeof schema>();
  const email = normalizeEmail(args.email);
  const existing = (await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1))[0];
  if (existing) throw new Error("Ya existe una cuenta con ese correo.");
  const now = new Date();
  const user: AuthenticatedUser = { id: crypto.randomUUID(), email, displayName: args.displayName.trim(), role };
  const passwordHash = await hashPassword(ctx, args.password);
  await db.insert(schema.users).values({
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    passwordHash,
    role,
    status: "active",
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now,
  });
  const session = await createAuthSession(ctx, user.id);
  return { user, ...session };
}

export async function loginAccount(ctx: Ctx, args: { email: string; password: string }): Promise<{ user: AuthenticatedUser; token: string; expiresAt: Date }> {
  const db = ctx.db<typeof schema>();
  const email = normalizeEmail(args.email);
  const user = (await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1))[0];
  if (!user) {
    // Match the expensive password path to reduce account-enumeration timing leaks.
    await hashPassword(ctx, args.password);
    throw new Error("Correo o contraseña incorrectos.");
  }
  const now = new Date();
  if (user.status !== "active") throw new Error("No se pudo iniciar sesión con esta cuenta.");
  if (user.lockedUntil && user.lockedUntil.getTime() > now.getTime()) {
    throw new Error("Demasiados intentos. Intenta de nuevo en 15 minutos.");
  }
  const valid = await verifyPassword(ctx, args.password, user.passwordHash);
  if (!valid) {
    const failed = user.failedLoginAttempts + 1;
    await db.update(schema.users).set({
      failedLoginAttempts: failed >= MAX_FAILED_ATTEMPTS ? 0 : failed,
      lockedUntil: failed >= MAX_FAILED_ATTEMPTS ? new Date(now.getTime() + LOCK_MS) : null,
      updatedAt: now,
    }).where(eq(schema.users.id, user.id));
    throw new Error("Correo o contraseña incorrectos.");
  }
  await db.update(schema.users).set({ failedLoginAttempts: 0, lockedUntil: null, updatedAt: now }).where(eq(schema.users.id, user.id));
  const session = await createAuthSession(ctx, user.id);
  return { user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, ...session };
}
