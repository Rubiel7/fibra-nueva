INSERT INTO portfolio_operations (
  session_id,
  ticker,
  kind,
  quantity,
  price_per_cbfi,
  amount,
  operation_date,
  note,
  created_at
)
SELECT
  session_id,
  ticker,
  'buy',
  quantity,
  average_cost,
  NULL,
  COALESCE(date(created_at / 1000, 'unixepoch'), date('now')),
  'Posición migrada del portafolio anterior',
  created_at
FROM portfolio
WHERE quantity > 0 AND average_cost > 0;
