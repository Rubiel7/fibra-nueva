DROP TABLE IF EXISTS entries;
--> statement-breakpoint
CREATE TABLE videos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  provider TEXT NOT NULL CHECK(provider IN ('youtube','vimeo')),
  video_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('Guía','Fichas','Análisis','Noticias')),
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  ticker TEXT NOT NULL,
  year INTEGER NOT NULL,
  period TEXT NOT NULL CHECK(period IN ('Anual','T1','T2','T3','T4')),
  blob_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX favorites_session_ticker ON favorites(session_id, ticker);
--> statement-breakpoint
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  target_price REAL NOT NULL,
  direction TEXT NOT NULL CHECK(direction IN ('above','below')),
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE portfolio (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  ticker TEXT NOT NULL,
  quantity REAL NOT NULL,
  average_cost REAL NOT NULL,
  created_at INTEGER NOT NULL
);
--> statement-breakpoint
CREATE TABLE quote_cache (
  ticker TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  as_of INTEGER NOT NULL
);