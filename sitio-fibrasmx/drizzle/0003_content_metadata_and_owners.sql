ALTER TABLE videos ADD COLUMN description TEXT;
--> statement-breakpoint
ALTER TABLE videos ADD COLUMN thumbnail_url TEXT;
--> statement-breakpoint
ALTER TABLE videos ADD COLUMN session_id TEXT NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
ALTER TABLE reports ADD COLUMN session_id TEXT NOT NULL DEFAULT 'legacy';
--> statement-breakpoint
CREATE UNIQUE INDEX reports_ticker_year_period_unique ON reports(ticker, year, period);
