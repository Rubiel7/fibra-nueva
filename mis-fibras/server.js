// ============================================================
//  Mis FIBRAs — servidor
//  Backend con Express + SQLite (node:sqlite integrado en
//  Node >= 22.5, sin dependencias nativas que compilar).
//
//  Expone la API REST de la app y sirve el frontend que vive
//  en ./public. La base de datos se crea sola al arrancar en
//  ./data/fibras.db.
// ============================================================

const express = require('express');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;

// ---------- Base de datos -------------------------------------
// El archivo vive junto al proyecto y se crea automáticamente.
const DATA_DIR = path.join(__dirname, 'data');
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'fibras.db'));

// ---------- Esquema -------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS catalog (
    ticker  TEXT PRIMARY KEY,
    name    TEXT NOT NULL,
    segment TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS operations (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    type     TEXT NOT NULL CHECK (type IN ('compra', 'venta', 'distribucion')),
    ticker   TEXT NOT NULL,
    cantidad REAL NOT NULL DEFAULT 0,
    precio   REAL NOT NULL DEFAULT 0,
    monto    REAL NOT NULL DEFAULT 0,
    fecha    TEXT NOT NULL,
    nota     TEXT NOT NULL DEFAULT ''
  );
  CREATE TABLE IF NOT EXISTS position_settings (
    ticker        TEXT PRIMARY KEY,
    current_price REAL
  );
  CREATE TABLE IF NOT EXISTS allocations (
    ticker     TEXT PRIMARY KEY,
    target_pct REAL NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS goals (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    target_amount REAL NOT NULL DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS goal_contributions (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_id INTEGER NOT NULL REFERENCES goals(id),
    amount  REAL NOT NULL DEFAULT 0,
    fecha   TEXT NOT NULL,
    nota    TEXT NOT NULL DEFAULT ''
  );
`);

// ---------- Semilla: catálogo de 12 FIBRAs --------------------
// Solo se siembra en el primer arranque (si la tabla está vacía).
// Todo lo demás inicia vacío: sin operaciones, metas ni ajustes.
const CATALOGO_INICIAL = [
  ['FUNO11',    'Fibra Uno',      ''],
  ['DANHOS13',  'Fibra Danhos',   ''],
  ['FIBRAMQ12', 'Fibra Macquarie',''],
  ['FIBRAPL14', 'Fibra Prologis', ''],
  ['FIBRAUP18', 'Fibra Upsite',   ''],
  ['FIHO12',    'Fibra Inn',      ''],
  ['FINN13',    'FINN13',         ''],
  ['FMTY14',    'Fibra Mty',      ''],
  ['FPLUS16',   'Fibra Plus',     ''],
  ['FSHOP13',   'Fibra Shop',     ''],
  ['STORAGE18', 'Fibra Storage',  ''],
  ['EDUCA18',   'Fibra Educa',    ''],
];

const catalogCount = db.prepare('SELECT COUNT(*) AS c FROM catalog').get().c;
if (catalogCount === 0) {
  const insertar = db.prepare('INSERT INTO catalog (ticker, name, segment) VALUES (?, ?, ?)');
  for (const [ticker, name, segment] of CATALOGO_INICIAL) {
    insertar.run(ticker, name, segment);
  }
  console.log('Catálogo sembrado con 12 FIBRAs.');
}
db.prepare("INSERT OR IGNORE INTO app_settings (key, value) VALUES ('allocation_threshold', '5')").run();

// ---------- Utilidades ----------------------------------------
const r2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const ES_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const TIPOS_OP = ['compra', 'venta', 'distribucion'];

// Precios actuales manuales por posición (ticker -> precio).
function preciosActuales() {
  const filas = db.prepare('SELECT ticker, current_price FROM position_settings').all();
  return Object.fromEntries(filas.map((f) => [f.ticker, f.current_price]));
}

/**
 * Calcula las posiciones a partir de las operaciones.
 * - cbfis = compras - ventas
 * - precio promedio = promedio ponderado de las compras
 * - precio actual = el manual, o el promedio si no hay manual
 * - Las posiciones con 0 (o menos) CBFIs se omiten (ya cerradas).
 */
function calcularPosiciones(hastaMes) {
  const ops = db.prepare('SELECT * FROM operations ORDER BY fecha ASC, id ASC').all();
  const precios = preciosActuales();
  const porTicker = {};

  for (const o of ops) {
    if (hastaMes && o.fecha.slice(0, 7) > hastaMes) break; // acumulado hasta el mes dado
    const t = o.ticker;
    if (!porTicker[t]) porTicker[t] = { ticker: t, buyQty: 0, buyCost: 0, sellQty: 0, distrib: 0 };
    const p = porTicker[t];
    if (o.type === 'compra') {
      p.buyQty += o.cantidad;
      p.buyCost += o.cantidad * o.precio;
    } else if (o.type === 'venta') {
      p.sellQty += o.cantidad;
    } else if (o.type === 'distribucion') {
      p.distrib += o.monto;
    }
  }

  const posiciones = [];
  for (const t of Object.keys(porTicker)) {
    const p = porTicker[t];
    const cbfis = p.buyQty - p.sellQty;
    if (cbfis <= 0) continue;
    const promedio = p.buyQty > 0 ? p.buyCost / p.buyQty : 0;
    const actual = precios[t] != null && precios[t] > 0 ? precios[t] : promedio;
    const costo = cbfis * promedio;
    const valor = cbfis * actual;
    posiciones.push({
      ticker: t,
      cbfis: r2(cbfis),
      precio_promedio: r2(promedio),
      precio_actual: r2(actual),
      costo: r2(costo),
      valor: r2(valor),
      ganancia: r2(valor - costo),
      distribuciones: r2(p.distrib),
      pct: 0,
    });
  }
  const totalValor = posiciones.reduce((s, x) => s + x.valor, 0);
  for (const x of posiciones) x.pct = totalValor > 0 ? r2((x.valor / totalValor) * 100) : 0;
  posiciones.sort((a, b) => b.valor - a.valor);

  return {
    positions: posiciones,
    total_valor: r2(totalValor),
    total_costo: r2(posiciones.reduce((s, x) => s + x.costo, 0)),
    total_ganancia: r2(posiciones.reduce((s, x) => s + x.ganancia, 0)),
  };
}

/** Serie de los últimos 12 meses: distribuciones, compras, valor y costo acumulados. */
function serieMensual() {
  const meses = [];
  const hoy = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push(d.toISOString().slice(0, 7)); // YYYY-MM
  }
  return meses.map((m) => {
    const ops = db.prepare('SELECT * FROM operations').all();
    let distribuciones = 0;
    let compras = 0;
    for (const o of ops) {
      if (o.fecha.slice(0, 7) !== m) continue;
      if (o.type === 'distribucion') distribuciones += o.monto;
      if (o.type === 'compra') compras += o.cantidad * o.precio;
    }
    const snap = calcularPosiciones(m);
    return {
      month: m,
      distribuciones: r2(distribuciones),
      compras: r2(compras),
      valor: snap.total_valor,
      costo: snap.total_costo,
    };
  });
}

// ---------- App Express ---------------------------------------
const app = express();
app.use(express.json());

// Pequeño envoltorio para no repetir try/catch en cada ruta.
const manejar = (fn) => (req, res) => {
  try {
    fn(req, res);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// ---------- Catálogo ------------------------------------------
app.get('/api/catalog', manejar((req, res) => {
  const filas = db.prepare('SELECT ticker, name, segment FROM catalog ORDER BY ticker').all();
  res.json(filas);
}));

app.post('/api/catalog', manejar((req, res) => {
  const { ticker, name, segment = '' } = req.body || {};
  if (!ticker || !name) return res.status(400).json({ error: 'ticker y name son obligatorios' });
  const t = String(ticker).trim().toUpperCase();
  try {
    db.prepare('INSERT INTO catalog (ticker, name, segment) VALUES (?, ?, ?)')
      .run(t, String(name).trim(), String(segment).trim());
  } catch {
    return res.status(409).json({ error: 'Ese ticker ya existe en el catálogo' });
  }
  res.status(201).json({ ticker: t, name: String(name).trim(), segment: String(segment).trim() });
}));

app.put('/api/catalog/:ticker', manejar((req, res) => {
  const t = req.params.ticker.toUpperCase();
  const { name, segment = '' } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name es obligatorio' });
  const r = db.prepare('UPDATE catalog SET name = ?, segment = ? WHERE ticker = ?')
    .run(String(name).trim(), String(segment).trim(), t);
  if (r.changes === 0) return res.status(404).json({ error: 'Ticker no encontrado' });
  res.json({ ticker: t, name: String(name).trim(), segment: String(segment).trim() });
}));

app.delete('/api/catalog/:ticker', manejar((req, res) => {
  const t = req.params.ticker.toUpperCase();
  db.prepare('DELETE FROM catalog WHERE ticker = ?').run(t);
  db.prepare('DELETE FROM position_settings WHERE ticker = ?').run(t);
  db.prepare('DELETE FROM allocations WHERE ticker = ?').run(t);
  res.json({ ok: true });
}));

// ---------- Operaciones ---------------------------------------
app.get('/api/operations', manejar((req, res) => {
  const filas = db.prepare('SELECT * FROM operations ORDER BY fecha DESC, id DESC').all();
  res.json(filas);
}));

app.post('/api/operations', manejar((req, res) => {
  const { type, ticker, cantidad = 0, precio = 0, monto = 0, fecha, nota = '' } = req.body || {};
  if (!TIPOS_OP.includes(type)) return res.status(400).json({ error: 'type debe ser compra, venta o distribucion' });
  if (!ticker) return res.status(400).json({ error: 'ticker es obligatorio' });
  if (!fecha || !ES_FECHA.test(fecha)) return res.status(400).json({ error: 'fecha debe ser YYYY-MM-DD' });
  if (type === 'distribucion' && !(monto > 0)) return res.status(400).json({ error: 'monto debe ser mayor a 0' });
  if (type !== 'distribucion' && (!(cantidad > 0) || !(precio > 0))) {
    return res.status(400).json({ error: 'cantidad y precio deben ser mayores a 0' });
  }
  const r = db.prepare(
    'INSERT INTO operations (type, ticker, cantidad, precio, monto, fecha, nota) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(type, String(ticker).toUpperCase(), r2(cantidad), r2(precio), r2(monto), fecha, String(nota));
  res.status(201).json(db.prepare('SELECT * FROM operations WHERE id = ?').get(r.lastInsertRowid));
}));

app.delete('/api/operations/:id', manejar((req, res) => {
  db.prepare('DELETE FROM operations WHERE id = ?').run(Number(req.params.id));
  res.json({ ok: true });
}));

// ---------- Posiciones (calculadas en el servidor) -------------
app.get('/api/positions', manejar((req, res) => {
  res.json(calcularPosiciones());
}));

app.put('/api/positions/:ticker', manejar((req, res) => {
  const t = req.params.ticker.toUpperCase();
  const { current_price } = req.body || {};
  if (current_price == null || current_price === '') {
    db.prepare('DELETE FROM position_settings WHERE ticker = ?').run(t);
  } else {
    if (!(Number(current_price) > 0)) return res.status(400).json({ error: 'current_price debe ser mayor a 0' });
    db.prepare('INSERT INTO position_settings (ticker, current_price) VALUES (?, ?) ON CONFLICT(ticker) DO UPDATE SET current_price = excluded.current_price')
      .run(t, r2(current_price));
  }
  res.json({ ok: true });
}));

// ---------- Asignación objetivo y umbral ------------------------
app.get('/api/allocations', manejar((req, res) => {
  const filas = db.prepare('SELECT ticker, target_pct FROM allocations').all();
  const umbral = db.prepare("SELECT value FROM app_settings WHERE key = 'allocation_threshold'").get();
  res.json({ allocations: filas, threshold: Number(umbral ? umbral.value : 5) });
}));

app.put('/api/allocations', manejar((req, res) => {
  const { allocations = {}, threshold } = req.body || {};
  const upsert = db.prepare(
    'INSERT INTO allocations (ticker, target_pct) VALUES (?, ?) ON CONFLICT(ticker) DO UPDATE SET target_pct = excluded.target_pct'
  );
  for (const [t, pct] of Object.entries(allocations)) {
    const v = Number(pct);
    if (t && v >= 0 && v <= 100) upsert.run(String(t).toUpperCase(), v);
  }
  if (threshold != null && Number(threshold) >= 0) {
    db.prepare("UPDATE app_settings SET value = ? WHERE key = 'allocation_threshold'").run(String(Number(threshold)));
  }
  res.json({ ok: true });
}));

// ---------- Metas ---------------------------------------------
app.get('/api/goals', manejar((req, res) => {
  const metas = db.prepare('SELECT * FROM goals ORDER BY id DESC').all();
  for (const g of metas) {
    const s = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS n FROM goal_contributions WHERE goal_id = ?').get(g.id);
    g.abonado = r2(s.total);
    g.abonos = s.n;
  }
  res.json(metas);
}));

app.post('/api/goals', manejar((req, res) => {
  const { name, target_amount = 0 } = req.body || {};
  if (!name || !(Number(target_amount) > 0)) {
    return res.status(400).json({ error: 'name y target_amount (> 0) son obligatorios' });
  }
  const r = db.prepare('INSERT INTO goals (name, target_amount) VALUES (?, ?)').run(String(name).trim(), r2(target_amount));
  res.status(201).json(db.prepare('SELECT * FROM goals WHERE id = ?').get(r.lastInsertRowid));
}));

app.delete('/api/goals/:id', manejar((req, res) => {
  const id = Number(req.params.id);
  db.prepare('DELETE FROM goal_contributions WHERE goal_id = ?').run(id);
  db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  res.json({ ok: true });
}));

app.get('/api/goals/:id/contributions', manejar((req, res) => {
  const filas = db.prepare('SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY fecha DESC, id DESC').all(Number(req.params.id));
  res.json(filas);
}));

app.post('/api/goals/:id/contributions', manejar((req, res) => {
  const goalId = Number(req.params.id);
  const { amount, fecha, nota = '' } = req.body || {};
  if (!(Number(amount) > 0)) return res.status(400).json({ error: 'amount debe ser mayor a 0' });
  if (!fecha || !ES_FECHA.test(fecha)) return res.status(400).json({ error: 'fecha debe ser YYYY-MM-DD' });
  const r = db.prepare('INSERT INTO goal_contributions (goal_id, amount, fecha, nota) VALUES (?, ?, ?, ?)')
    .run(goalId, r2(amount), fecha, String(nota));
  res.status(201).json(db.prepare('SELECT * FROM goal_contributions WHERE id = ?').get(r.lastInsertRowid));
}));

app.delete('/api/goals/:goalId/contributions/:id', manejar((req, res) => {
  db.prepare('DELETE FROM goal_contributions WHERE id = ? AND goal_id = ?').run(Number(req.params.id), Number(req.params.goalId));
  res.json({ ok: true });
}));

// ---------- Datos para el Panel --------------------------------
// Serie de 12 meses para las gráficas y resumen de un mes dado.
app.get('/api/monthly-series', manejar((req, res) => {
  res.json(serieMensual());
}));

app.get('/api/monthly', manejar((req, res) => {
  const m = req.query.month;
  if (!m || !/^\d{4}-\d{2}$/.test(m)) return res.status(400).json({ error: 'month debe ser YYYY-MM' });
  let compras = 0;
  let distribuciones = 0;
  for (const o of db.prepare('SELECT * FROM operations').all()) {
    if (o.fecha.slice(0, 7) !== m) continue;
    if (o.type === 'compra') compras += o.cantidad * o.precio;
    if (o.type === 'distribucion') distribuciones += o.monto;
  }
  const snap = calcularPosiciones(); // valor y ganancia son los actuales
  res.json({
    month: m,
    compras_mes: r2(compras),
    distribuciones_mes: r2(distribuciones),
    valor_portafolio: snap.total_valor,
    ganancia: snap.total_ganancia,
  });
}));

// ---------- Frontend estático ----------------------------------
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
  console.log(`Mis FIBRAs corriendo en http://localhost:${PORT}`);
  console.log(`Base de datos: ${path.join(DATA_DIR, 'fibras.db')}`);
});
