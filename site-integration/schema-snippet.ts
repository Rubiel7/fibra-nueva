// SNIPPET — pegar al final de server/src/schema.ts (fibrasmx-2)
// Requiere: uniqueIndex ya importado de "drizzle-orm/sqlite-core".

/**
 * Corridas semanales del modelo SA-TAFE (Threshold Accepting Forecasting Ensemble).
 * UN SOLO LUGAR DOCUMENTADO para los datos del "Laboratorio cuantitativo":
 * cada corrida semanal inserta (o reemplaza por run_date) una fila con el JSON
 * completo de results/sa-tafe-latest.json. La UI siempre lee la fila con
 * run_date más reciente: actualizar los datos NO requiere rebuild.
 */
export const saTafeRuns = sqliteTable("sa_tafe_runs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  runDate: text("run_date").notNull(),
  priceCutoff: text("price_cutoff").notNull(),
  horizonWeeks: integer("horizon_weeks").notNull(),
  payloadJson: text("payload_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("sa_tafe_runs_run_date_unique").on(table.runDate),
]);
