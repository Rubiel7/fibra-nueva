import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const videos = sqliteTable("videos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  url: text("url").notNull(),
  provider: text("provider", { enum: ["youtube", "vimeo"] }).notNull(),
  videoId: text("video_id").notNull(),
  ticker: text("ticker").notNull(),
  category: text("category", { enum: ["Guía", "Fichas", "Análisis", "Noticias"] }).notNull(),
  description: text("description"),
  thumbnailUrl: text("thumbnail_url"),
  sessionId: text("session_id").notNull().default("legacy"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  ticker: text("ticker").notNull(),
  year: integer("year").notNull(),
  period: text("period", { enum: ["Anual", "T1", "T2", "T3", "T4"] }).notNull(),
  blobKey: text("blob_key").notNull(),
  fileName: text("file_name").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  sessionId: text("session_id").notNull().default("legacy"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const favorites = sqliteTable("favorites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  ticker: text("ticker").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const alerts = sqliteTable("alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  ticker: text("ticker").notNull(),
  targetPrice: real("target_price").notNull(),
  direction: text("direction", { enum: ["above", "below"] }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const portfolio = sqliteTable("portfolio", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  ticker: text("ticker").notNull(),
  quantity: real("quantity").notNull(),
  averageCost: real("average_cost").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const portfolioOperations = sqliteTable("portfolio_operations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  ticker: text("ticker").notNull(),
  kind: text("kind", { enum: ["buy", "sell", "distribution"] }).notNull(),
  quantity: real("quantity"),
  pricePerCbfi: real("price_per_cbfi"),
  amount: real("amount"),
  operationDate: text("operation_date").notNull(),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  index("portfolio_operations_session_date_idx").on(table.sessionId, table.operationDate),
  index("portfolio_operations_session_ticker_idx").on(table.sessionId, table.ticker),
]);

export const portfolioPositionPreferences = sqliteTable("portfolio_position_preferences", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  ticker: text("ticker").notNull(),
  manualPrice: real("manual_price"),
  targetPercent: real("target_percent").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [
  uniqueIndex("portfolio_position_preferences_session_ticker_unique").on(table.sessionId, table.ticker),
]);

export const portfolioSettings = sqliteTable("portfolio_settings", {
  sessionId: text("session_id").primaryKey(),
  deviationThreshold: real("deviation_threshold").notNull().default(5),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
});

export const investmentGoals = sqliteTable("investment_goals", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  name: text("name").notNull(),
  targetAmount: real("target_amount").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("investment_goals_session_idx").on(table.sessionId)]);

export const goalContributions = sqliteTable("goal_contributions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  goalId: integer("goal_id").notNull().references(() => investmentGoals.id, { onDelete: "cascade" }),
  amount: real("amount").notNull(),
  contributionDate: text("contribution_date").notNull(),
  note: text("note"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(() => new Date()),
}, (table) => [index("goal_contributions_goal_idx").on(table.goalId)]);

export const quoteCache = sqliteTable("quote_cache", {
  ticker: text("ticker").primaryKey(),
  payload: text("payload").notNull(),
  asOf: integer("as_of", { mode: "timestamp_ms" }).notNull(),
});

export const fibraDistributions = sqliteTable("fibra_distributions", {
  ticker: text("ticker").primaryKey(),
  latestDistribution: real("latest_distribution"),
  distributionCurrency: text("distribution_currency", { enum: ["MXN", "USD"] }).notNull().default("MXN"),
  distributionPeriod: text("distribution_period").notNull(),
  paymentFrequency: text("payment_frequency").notNull(),
  annualizedDistribution: real("annualized_distribution"),
  quarterlyAffoPerCbfi: real("quarterly_affo_per_cbfi"),
  quality: text("quality", { enum: ["verified", "unverified", "no_distributions", "single_payment"] }).notNull(),
  note: text("note"),
  fiscalNote: text("fiscal_note"),
  fundamentalsAsOf: text("fundamentals_as_of").notNull().default("2T26"),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

/**
 * Dormant account system. The current UI intentionally keeps using anonymous
 * browser sessions until account-backed favorites are enabled product-wide.
 * Passwords are never stored here: only Bun's Argon2id hashes are persisted.
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ["admin", "user"] }).notNull().default("user"),
  status: text("status", { enum: ["active", "disabled"] }).notNull().default("active"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp_ms" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("users_email_unique").on(table.email),
  index("users_role_idx").on(table.role),
]);

export const authSessions = sqliteTable("auth_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  lastUsedAt: integer("last_used_at", { mode: "timestamp_ms" }).notNull(),
}, (table) => [
  uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash),
  index("auth_sessions_user_id_idx").on(table.userId),
  index("auth_sessions_expires_at_idx").on(table.expiresAt),
]);

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
