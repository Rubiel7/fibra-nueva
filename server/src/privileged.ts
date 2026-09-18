import { definePrivilegedContracts, definePrivilegedHandlers, z } from "@hatch/space-sdk";

export const privileged = definePrivilegedContracts({
  hashPassword: {
    request: z.object({ password: z.string().min(1).max(128) }),
    response: z.object({ passwordHash: z.string() }),
    timeoutMs: 30_000,
  },
  verifyPassword: {
    request: z.object({ password: z.string().min(1).max(128), passwordHash: z.string() }),
    response: z.object({ valid: z.boolean() }),
    timeoutMs: 30_000,
  },
});

export const privilegedHandlers = definePrivilegedHandlers(privileged, {
  async hashPassword({ password }) {
    return { passwordHash: await Bun.password.hash(password, { algorithm: "argon2id" }) };
  },
  async verifyPassword({ password, passwordHash }) {
    return { valid: await Bun.password.verify(password, passwordHash) };
  },
});
