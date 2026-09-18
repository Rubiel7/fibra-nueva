// SNIPPET — pegar dentro del objeto de acciones en server/src/actions.ts (fibrasmx-2),
// junto a getLiveRatios. Requiere: defineAction, z, desc ya importados;
// schema.saTafeRuns definido en schema.ts (ver schema-snippet.ts).

const saTafeRunShape = z.object({
  runDate: z.string(),
  priceCutoff: z.string(),
  horizonWeeks: z.number(),
  payloadJson: z.string(),
});

getSaTafeLatest: defineAction({
  request: z.object({}),
  response: z.object({ run: saTafeRunShape.nullable() }),
  async handler(ctx) {
    const rows = await ctx.db<typeof schema>().select().from(schema.saTafeRuns)
      .orderBy(desc(schema.saTafeRuns.runDate)).limit(1);
    const row = rows[0];
    return { run: row ? {
      runDate: row.runDate,
      priceCutoff: row.priceCutoff,
      horizonWeeks: row.horizonWeeks,
      payloadJson: row.payloadJson,
    } : null };
  },
}),

// Escritura semanal. La llama el job semanal (cada lunes) vía artifact.invoke_action
// con el contenido de results/sa-tafe-latest.json. NO se expone en la UI del cliente:
// no hay formulario ni botón que la invoque. Hace upsert por run_date.
saveSaTafeRun: defineAction({
  request: z.object({
    runDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    priceCutoff: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    horizonWeeks: z.number().int().positive().max(104),
    payloadJson: z.string().min(100),
  }),
  response: z.object({ ok: z.literal(true), id: z.number() }),
  async handler(ctx, args): Promise<{ ok: true; id: number }> {
    let payload: unknown;
    try { payload = JSON.parse(args.payloadJson); }
    catch { throw new Error("payloadJson no es JSON válido."); }
    const p = payload as { tickers?: unknown; portfolio?: unknown };
    if (!Array.isArray(p.tickers) || typeof p.portfolio !== "object" || p.portfolio === null) {
      throw new Error("El JSON no tiene la estructura SA-TAFE esperada (tickers[], portfolio).");
    }
    const db = ctx.db<typeof schema>();
    const row = (await db.insert(schema.saTafeRuns)
      .values({ runDate: args.runDate, priceCutoff: args.priceCutoff, horizonWeeks: args.horizonWeeks, payloadJson: args.payloadJson, createdAt: new Date() })
      .onConflictDoUpdate({
        target: schema.saTafeRuns.runDate,
        set: { priceCutoff: args.priceCutoff, horizonWeeks: args.horizonWeeks, payloadJson: args.payloadJson, createdAt: new Date() },
      })
      .returning({ id: schema.saTafeRuns.id }))[0];
    if (!row) throw new Error("No se pudo guardar la corrida SA-TAFE.");
    ctx.invalidateQueries();
    return { ok: true, id: row.id };
  },
}),
