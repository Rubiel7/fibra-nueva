CREATE TABLE portfolio_operations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('buy','sell','distribution')),
  quantity REAL,
  price_per_cbfi REAL,
  amount REAL,
  operation_date TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX portfolio_operations_session_date_idx ON portfolio_operations(session_id, operation_date);
--> statement-breakpoint
CREATE INDEX portfolio_operations_session_ticker_idx ON portfolio_operations(session_id, ticker);
--> statement-breakpoint
CREATE TABLE portfolio_position_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  manual_price REAL,
  target_percent REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX portfolio_position_preferences_session_ticker_unique ON portfolio_position_preferences(session_id, ticker);
--> statement-breakpoint
CREATE TABLE portfolio_settings (
  session_id TEXT PRIMARY KEY,
  deviation_threshold REAL NOT NULL DEFAULT 5,
  updated_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE investment_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target_amount REAL NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX investment_goals_session_idx ON investment_goals(session_id);
--> statement-breakpoint
CREATE TABLE goal_contributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL REFERENCES investment_goals(id) ON DELETE CASCADE,
  amount REAL NOT NULL,
  contribution_date TEXT NOT NULL,
  note TEXT,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE INDEX goal_contributions_goal_idx ON goal_contributions(goal_id);
