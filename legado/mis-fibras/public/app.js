/* ============================================================
   Mis FIBRAs — lógica del frontend
   JavaScript vanilla, sin frameworks ni CDNs externos.
   Las gráficas se dibujan con SVG puro.
   ============================================================ */

'use strict';

// ---------- Formato de moneda y fechas --------------------------
const mxn = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const MESES_CORTO = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 'YYYY-MM-DD' -> '17 sep 2026' (sin desfase de zona horaria)
function fmtFecha(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

// 'YYYY-MM' -> 'sep 2026'
function etiquetaMes(ym) {
  const [y, m] = ym.split('-').map(Number);
  return MESES_CORTO[m - 1] + ' ' + y;
}

function mesActual() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

// ---------- Cliente de la API ----------------------------------
async function apiJSON(url, opciones = {}) {
  const r = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...opciones });
  const datos = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(datos.error || 'Error de red');
  return datos;
}
const apiGet  = (u) => apiJSON(u);
const apiPost = (u, b) => apiJSON(u, { method: 'POST', body: JSON.stringify(b) });
const apiPut  = (u, b) => apiJSON(u, { method: 'PUT', body: JSON.stringify(b) });
const apiDel  = (u) => apiJSON(u, { method: 'DELETE' });

// ---------- Estado ----------------------------------------------
let catalogo = [];                    // [{ticker, name, segment}]
let mesSel = mesActual();             // mes mostrado en el Panel

function nombreTicker(ticker) {
  const f = catalogo.find((c) => c.ticker === ticker);
  return f ? f.name : ticker;
}

function opcionesTickers(seleccionado) {
  return catalogo
    .map((c) => `<option value="${esc(c.ticker)}" ${c.ticker === seleccionado ? 'selected' : ''}>${esc(c.ticker)} — ${esc(c.name)}</option>`)
    .join('');
}

// ---------- Navegación por pestañas ------------------------------
document.querySelectorAll('.tabbar button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabbar button').forEach((b) => b.classList.remove('activo'));
    btn.classList.add('activo');
    document.querySelectorAll('.vista').forEach((v) => v.classList.remove('activa'));
    document.getElementById('vista-' + btn.dataset.vista).classList.add('activa');
    renderVista(btn.dataset.vista);
    window.scrollTo(0, 0);
  });
});

function renderVista(v) {
  if (v === 'panel') return renderPanel();
  if (v === 'operaciones') return renderOperaciones();
  if (v === 'portafolio') return renderPortafolio();
  if (v === 'metas') return renderMetas();
}

// ---------- Gráficas SVG puras ----------------------------------

// Gráfica de barras simple. datos: [{etiqueta, valor}], color opcional.
function graficaBarras(datos, color) {
  color = color || '#0e7a5f';
  const W = 400, H = 200, padIzq = 8, padAbajo = 26, padArriba = 18;
  const max = Math.max(1, ...datos.map((d) => d.valor));
  const n = datos.length;
  const anchoBarra = Math.min(34, (W - padIzq * 2) / n * 0.55);
  const paso = (W - padIzq * 2) / n;

  let rects = '';
  datos.forEach((d, i) => {
    const h = ((H - padAbajo - padArriba) * d.valor) / max;
    const x = padIzq + paso * i + (paso - anchoBarra) / 2;
    const y = H - padAbajo - h;
    rects += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${anchoBarra.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${color}">` +
      `<title>${esc(d.etiqueta)}: ${mxn.format(d.valor)}</title></rect>`;
    if (d.valor > 0) {
      rects += `<text x="${(x + anchoBarra / 2).toFixed(1)}" y="${(y - 4).toFixed(1)}" text-anchor="middle" font-size="8" fill="#6b7280">${d.valor >= 1000 ? (d.valor / 1000).toFixed(1) + 'k' : d.valor.toFixed(0)}</text>`;
    }
    rects += `<text x="${(x + anchoBarra / 2).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#6b7280">${esc(d.etiqueta)}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gráfica de barras">${rects}</svg>`;
}

// Barras agrupadas de dos series. series: [{nombre, color, valores:[...]}], etiquetas: [...]
function graficaBarrasDobles(etiquetas, series) {
  const W = 400, H = 210, padIzq = 8, padAbajo = 26, padArriba = 14;
  const max = Math.max(1, ...series.flatMap((s) => s.valores));
  const n = etiquetas.length;
  const paso = (W - padIzq * 2) / n;
  const ancho = Math.min(22, paso * 0.32);

  let dibujo = '';
  etiquetas.forEach((et, i) => {
    const cx = padIzq + paso * i + paso / 2;
    series.forEach((s, j) => {
      const v = s.valores[i];
      const h = ((H - padAbajo - padArriba) * v) / max;
      const x = cx + (j - (series.length - 1) / 2) * (ancho + 2) - ancho / 2;
      dibujo += `<rect x="${x.toFixed(1)}" y="${(H - padAbajo - h).toFixed(1)}" width="${ancho.toFixed(1)}" height="${h.toFixed(1)}" rx="3" fill="${s.color}">` +
        `<title>${esc(et)} · ${esc(s.nombre)}: ${mxn.format(v)}</title></rect>`;
    });
    dibujo += `<text x="${cx.toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="9" fill="#6b7280">${esc(et)}</text>`;
  });

  const leyenda = series
    .map((s) => `<span style="--color:${s.color}">${esc(s.nombre)}</span>`)
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparativa mensual">${dibujo}</svg><div class="leyenda">${leyenda}</div>`;
}

// Dona por FIBRA. items: [{etiqueta, valor, color}]
function graficaDona(items) {
  const R = 70, C = 2 * Math.PI * R; // circunferencia
  const total = items.reduce((s, x) => s + x.valor, 0);
  if (total <= 0) return '<p class="vacio">Sin valor en el portafolio todavía.</p>';

  let offset = 0;
  let segmentos = '';
  items.forEach((it) => {
    const frac = it.valor / total;
    segmentos += `<circle cx="90" cy="90" r="${R}" fill="none" stroke="${it.color}" stroke-width="30" ` +
      `stroke-dasharray="${(frac * C).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-offset * C).toFixed(2)}" transform="rotate(-90 90 90)">` +
      `<title>${esc(it.etiqueta)}: ${mxn.format(it.valor)} (${(frac * 100).toFixed(1)}%)</title></circle>`;
    offset += frac;
  });

  const leyenda = items
    .map((it) => `<span style="--color:${it.color}">${esc(it.etiqueta)} ${(it.valor / total * 100).toFixed(1)}%</span>`)
    .join('');
  return `<svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="Distribución por FIBRA">${segmentos}` +
    `<text x="90" y="86" text-anchor="middle" font-size="15" font-weight="bold" fill="#1c1c1e">${mxn.format(total)}</text>` +
    `<text x="90" y="104" text-anchor="middle" font-size="10" fill="#6b7280">total</text></svg>` +
    `<div class="leyenda">${leyenda}</div>`;
}

const COLORES = ['#0e7a5f', '#1a56db', '#b26a00', '#8e44ad', '#c0392b', '#0e7490', '#4d7c0f', '#be123c', '#6d28d9', '#0f766e', '#a16207', '#334155'];

// ---------- Vista: Panel -----------------------------------------
async function renderPanel() {
  const cont = document.getElementById('tarjetas-panel');
  cont.innerHTML = '<p class="vacio">Cargando…</p>';
  try {
    const [resumen, serie, pos] = await Promise.all([
      apiGet('/api/monthly?month=' + encodeURIComponent(mesSel)),
      apiGet('/api/monthly-series'),
      apiGet('/api/positions'),
    ]);

    const g = resumen.ganancia;
    const claseG = g > 0 ? 'positivo' : g < 0 ? 'negativo' : '';

    cont.innerHTML = `
      <div class="tarjeta"><div class="etiqueta">Valor del portafolio</div><div class="valor">${mxn.format(resumen.valor_portafolio)}</div></div>
      <div class="tarjeta"><div class="etiqueta">Ganancia / pérdida</div><div class="valor ${claseG}">${mxn.format(g)}</div></div>
      <div class="tarjeta"><div class="etiqueta">Distribuciones · ${esc(etiquetaMes(mesSel))}</div><div class="valor">${mxn.format(resumen.distribuciones_mes)}</div></div>
      <div class="tarjeta"><div class="etiqueta">Compras · ${esc(etiquetaMes(mesSel))}</div><div class="valor">${mxn.format(resumen.compras_mes)}</div></div>`;

    // Gráfica 1: distribuciones de los últimos 12 meses
    document.getElementById('graf-distribuciones').innerHTML =
      graficaBarras(serie.map((s) => ({ etiqueta: etiquetaMes(s.month).split(' ')[0], valor: s.distribuciones })), '#1a56db');

    // Gráfica 2: valor del portafolio vs costo invertido por mes (el valor usa el
    // precio actual como aproximación, acumulado con las operaciones de cada mes)
    document.getElementById('graf-valor-costo').innerHTML =
      graficaBarrasDobles(
        serie.map((s) => etiquetaMes(s.month).split(' ')[0]),
        [
          { nombre: 'Valor', color: '#0e7a5f', valores: serie.map((s) => s.valor) },
          { nombre: 'Costo', color: '#b26a00', valores: serie.map((s) => s.costo) },
        ]
      );

    // Gráfica 3: dona por FIBRA (% del valor actual)
    document.getElementById('graf-dona').innerHTML =
      graficaDona(pos.positions.map((p, i) => ({ etiqueta: p.ticker, valor: p.valor, color: COLORES[i % COLORES.length] })));
  } catch (err) {
    cont.innerHTML = `<p class="vacio">No se pudo cargar el panel: ${esc(err.message)}</p>`;
  }
}

document.getElementById('selector-mes').addEventListener('change', (e) => {
  if (e.target.value) mesSel = e.target.value;
  renderPanel();
});

// ---------- Vista: Operaciones -----------------------------------
const ETIQUETAS_TIPO = { compra: 'Compra', venta: 'Venta', distribucion: 'Distribución' };

function alternarCamposOperacion() {
  const tipo = document.getElementById('op-tipo').value;
  const esDist = tipo === 'distribucion';
  document.getElementById('campos-cbfi').classList.toggle('oculto', esDist);
  document.getElementById('campos-distribucion').classList.toggle('oculto', !esDist);
}
document.getElementById('op-tipo').addEventListener('change', alternarCamposOperacion);

document.getElementById('form-operacion').addEventListener('submit', async (e) => {
  e.preventDefault();
  const tipo = document.getElementById('op-tipo').value;
  const cuerpo = {
    type: tipo,
    ticker: document.getElementById('op-ticker').value,
    fecha: document.getElementById('op-fecha').value,
    nota: document.getElementById('op-nota').value.trim(),
    cantidad: Number(document.getElementById('op-cantidad').value) || 0,
    precio: Number(document.getElementById('op-precio').value) || 0,
    monto: Number(document.getElementById('op-monto').value) || 0,
  };
  try {
    await apiPost('/api/operations', cuerpo);
    e.target.reset();
    document.getElementById('op-fecha').value = new Date().toISOString().slice(0, 10);
    alternarCamposOperacion();
    renderOperaciones();
  } catch (err) {
    alert('No se pudo guardar: ' + err.message);
  }
});

async function renderOperaciones() {
  const lista = document.getElementById('lista-operaciones');
  const sel = document.getElementById('op-ticker');
  sel.innerHTML = opcionesTickers();
  if (!document.getElementById('op-fecha').value) {
    document.getElementById('op-fecha').value = new Date().toISOString().slice(0, 10);
  }
  try {
    const ops = await apiGet('/api/operations');
    if (ops.length === 0) {
      lista.innerHTML = '<p class="vacio">Aún no hay operaciones. Registra tu primera compra arriba.</p>';
      return;
    }
    lista.innerHTML = ops.map((o) => {
      const detalle = o.type === 'distribucion'
        ? `${mxn.format(o.monto)} recibidos`
        : `${o.cantidad} CBFIs a ${mxn.format(o.precio)} c/u = ${mxn.format(o.cantidad * o.precio)}`;
      return `
        <div class="item">
          <div class="fila">
            <div>
              <span class="etiqueta-tipo ${o.type}">${ETIQUETAS_TIPO[o.type]}</span>
              <span class="titulo"> ${esc(o.ticker)}</span>
              <span class="detalle"> · ${esc(nombreTicker(o.ticker))}</span>
            </div>
            <button class="eliminar" data-id="${o.id}" title="Eliminar">🗑️</button>
          </div>
          <div class="detalle">${esc(detalle)}</div>
          <div class="detalle">${fmtFecha(o.fecha)}</div>
          ${o.nota ? `<div class="nota">${esc(o.nota)}</div>` : ''}
        </div>`;
    }).join('');
    lista.querySelectorAll('.eliminar').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta operación?')) return;
      await apiDel('/api/operations/' + b.dataset.id);
      renderOperaciones();
    }));
  } catch (err) {
    lista.innerHTML = `<p class="vacio">No se pudo cargar: ${esc(err.message)}</p>`;
  }
}

// ---------- Vista: Portafolio ------------------------------------
async function renderPortafolio() {
  const listaPos = document.getElementById('lista-posiciones');
  const listaAsig = document.getElementById('lista-asignaciones');
  try {
    const [pos, asig] = await Promise.all([apiGet('/api/positions'), apiGet('/api/allocations')]);
    const objetivos = Object.fromEntries(asig.allocations.map((a) => [a.ticker, a.target_pct]));
    const umbral = asig.threshold;

    // --- Posiciones ---
    if (pos.positions.length === 0) {
      listaPos.innerHTML = '<p class="vacio">Sin posiciones abiertas. Registra compras en la pestaña Operaciones.</p>';
    } else {
      listaPos.innerHTML = pos.positions.map((p) => {
        const claseG = p.ganancia > 0 ? 'positivo' : p.ganancia < 0 ? 'negativo' : '';
        return `
        <div class="item">
          <div class="fila">
            <div><span class="titulo">${esc(p.ticker)}</span> <span class="detalle">· ${esc(nombreTicker(p.ticker))}</span></div>
            <span class="${claseG}">${p.ganancia >= 0 ? '+' : ''}${mxn.format(p.ganancia)}</span>
          </div>
          <div class="detalle">
            ${p.cbfis} CBFIs · Promedio ${mxn.format(p.precio_promedio)}<br>
            Valor actual: <strong>${mxn.format(p.valor)}</strong> (${p.pct}% del portafolio)
          </div>
          <div class="precio-inline">
            <label for="precio-${esc(p.ticker)}">Precio actual:</label>
            <input type="number" id="precio-${esc(p.ticker)}" data-ticker="${esc(p.ticker)}" class="input-precio"
              min="0" step="any" inputmode="decimal" value="${p.precio_actual}" placeholder="${p.precio_promedio}">
            <button class="btn-secundario guardar-precio" data-ticker="${esc(p.ticker)}">Guardar</button>
          </div>
        </div>`;
      }).join('');

      listaPos.querySelectorAll('.guardar-precio').forEach((b) => b.addEventListener('click', async () => {
        const ticker = b.dataset.ticker;
        const input = listaPos.querySelector(`.input-precio[data-ticker="${CSS.escape(ticker)}"]`);
        try {
          await apiPut('/api/positions/' + encodeURIComponent(ticker), { current_price: Number(input.value) || null });
          renderPortafolio();
        } catch (err) {
          alert('No se pudo guardar el precio: ' + err.message);
        }
      }));
    }

    // --- Umbral de alerta ---
    const inputUmbral = document.getElementById('umbral-alerta');
    inputUmbral.value = umbral;
    inputUmbral.onchange = async () => {
      try {
        await apiPut('/api/allocations', { threshold: Number(inputUmbral.value) || 0 });
        renderPortafolio();
      } catch (err) { alert('No se pudo guardar el umbral: ' + err.message); }
    };

    // --- Asignación objetivo vs real ---
    if (pos.positions.length === 0) {
      listaAsig.innerHTML = '';
    } else {
      listaAsig.innerHTML = pos.positions.map((p) => {
        const objetivo = objetivos[p.ticker] || 0;
        const desviacion = p.pct - objetivo;
        const alerta = Math.abs(desviacion) > umbral && objetivo > 0;
        const ancho = Math.min(100, Math.max(0, p.pct));
        return `
        <div class="item">
          <div class="fila">
            <span class="titulo">${esc(p.ticker)}</span>
            <span class="detalle">Real ${p.pct}% · Objetivo
              <input type="number" class="input-objetivo" data-ticker="${esc(p.ticker)}" min="0" max="100" step="0.5"
                inputmode="decimal" value="${objetivo}" style="width:70px;padding:6px;border:1px solid #e5e7eb;border-radius:8px;"> %
            </span>
          </div>
          <div class="barra ${alerta ? 'excedida' : ''}"><div style="width:${ancho}%"></div></div>
          ${alerta
            ? `<div class="alerta">⚠️ Desviación de ${Math.abs(desviacion).toFixed(1)} puntos (umbral: ${umbral}). Considera rebalancear.</div>`
            : (objetivo > 0 ? `<div class="ok-msg">✓ Dentro del umbral de ${umbral} puntos.</div>` : '')}
        </div>`;
      }).join('');

      listaAsig.querySelectorAll('.input-objetivo').forEach((inp) => inp.addEventListener('change', async () => {
        const cambios = {};
        listaAsig.querySelectorAll('.input-objetivo').forEach((x) => { cambios[x.dataset.ticker] = Number(x.value) || 0; });
        try {
          await apiPut('/api/allocations', { allocations: cambios });
          renderPortafolio();
        } catch (err) { alert('No se pudo guardar: ' + err.message); }
      }));
    }

    renderCatalogo();
  } catch (err) {
    listaPos.innerHTML = `<p class="vacio">No se pudo cargar: ${esc(err.message)}</p>`;
  }
}

// ---------- Catálogo (dentro de Portafolio) -----------------------
async function renderCatalogo() {
  const lista = document.getElementById('lista-catalogo');
  lista.innerHTML = catalogo.map((c) => `
    <div class="item" data-ticker="${esc(c.ticker)}">
      <div class="fila">
        <div><span class="titulo">${esc(c.ticker)}</span><br><span class="detalle">${esc(c.name)}${c.segment ? ' · ' + esc(c.segment) : ''}</span></div>
        <div>
          <button class="btn-secundario editar-cat" data-ticker="${esc(c.ticker)}">Editar</button>
          <button class="eliminar borrar-cat" data-ticker="${esc(c.ticker)}" title="Eliminar">🗑️</button>
        </div>
      </div>
      <div class="edicion-cat oculto">
        <div class="abono-form">
          <input type="text" class="edit-nombre" value="${esc(c.name)}" placeholder="Nombre">
          <input type="text" class="edit-segmento" value="${esc(c.segment)}" placeholder="Segmento">
          <button class="btn-secundario guardar-cat">Guardar</button>
        </div>
      </div>
    </div>`).join('');

  lista.querySelectorAll('.editar-cat').forEach((b) => b.addEventListener('click', () => {
    b.closest('.item').querySelector('.edicion-cat').classList.toggle('oculto');
  }));
  lista.querySelectorAll('.guardar-cat').forEach((b) => b.addEventListener('click', async () => {
    const item = b.closest('.item');
    const ticker = item.dataset.ticker;
    try {
      await apiPut('/api/catalog/' + encodeURIComponent(ticker), {
        name: item.querySelector('.edit-nombre').value,
        segment: item.querySelector('.edit-segmento').value,
      });
      await recargarCatalogo();
      renderPortafolio();
    } catch (err) { alert('No se pudo guardar: ' + err.message); }
  }));
  lista.querySelectorAll('.borrar-cat').forEach((b) => b.addEventListener('click', async () => {
    if (!confirm(`¿Eliminar ${b.dataset.ticker} del catálogo?`)) return;
    try {
      await apiDel('/api/catalog/' + encodeURIComponent(b.dataset.ticker));
      await recargarCatalogo();
      renderPortafolio();
    } catch (err) { alert('No se pudo eliminar: ' + err.message); }
  }));
}

document.getElementById('form-catalogo').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiPost('/api/catalog', {
      ticker: document.getElementById('cat-ticker').value,
      name: document.getElementById('cat-nombre').value,
      segment: document.getElementById('cat-segmento').value,
    });
    e.target.reset();
    await recargarCatalogo();
    renderPortafolio();
  } catch (err) { alert('No se pudo agregar: ' + err.message); }
});

// ---------- Vista: Metas -----------------------------------------
document.getElementById('form-meta').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await apiPost('/api/goals', {
      name: document.getElementById('meta-nombre').value.trim(),
      target_amount: Number(document.getElementById('meta-objetivo').value) || 0,
    });
    e.target.reset();
    renderMetas();
  } catch (err) { alert('No se pudo crear la meta: ' + err.message); }
});

async function renderMetas() {
  const lista = document.getElementById('lista-metas');
  try {
    const metas = await apiGet('/api/goals');
    if (metas.length === 0) {
      lista.innerHTML = '<p class="vacio">Aún no tienes metas. Crea la primera arriba.</p>';
      return;
    }
    lista.innerHTML = metas.map((g) => {
      const pct = g.target_amount > 0 ? Math.min(100, (g.abonado / g.target_amount) * 100) : 0;
      return `
      <div class="item" data-goal="${g.id}">
        <div class="fila">
          <span class="titulo">${esc(g.name)}</span>
          <button class="eliminar borrar-meta" data-id="${g.id}" title="Eliminar meta">🗑️</button>
        </div>
        <div class="detalle">${mxn.format(g.abonado)} de ${mxn.format(g.target_amount)} · ${pct.toFixed(1)}%</div>
        <div class="barra"><div style="width:${pct}%"></div></div>
        <details class="abonos">
          <summary>Abonos (${g.abonos})</summary>
          <div class="contribuciones"></div>
          <div class="abono-form">
            <input type="number" class="abono-monto" min="0" step="any" inputmode="decimal" placeholder="Monto">
            <input type="date" class="abono-fecha" value="${new Date().toISOString().slice(0, 10)}">
            <input type="text" class="abono-nota" placeholder="Nota (opcional)">
            <button class="btn-secundario agregar-abono" data-id="${g.id}">Abonar</button>
          </div>
        </details>
      </div>`;
    }).join('');

    // Cargar contribuciones de cada meta al abrir el <details>
    lista.querySelectorAll('details.abonos').forEach((det) => {
      det.addEventListener('toggle', async () => {
        if (!det.open) return;
        const goalId = det.closest('.item').dataset.goal;
        const cont = det.querySelector('.contribuciones');
        try {
          const abonos = await apiGet(`/api/goals/${goalId}/contributions`);
          cont.innerHTML = abonos.length === 0
            ? '<p class="detalle">Sin abonos todavía.</p>'
            : abonos.map((a) => `
              <div class="fila" style="margin-top:6px">
                <span class="detalle"><strong>${mxn.format(a.amount)}</strong> · ${fmtFecha(a.fecha)}${a.nota ? ' · ' + esc(a.nota) : ''}</span>
                <button class="eliminar borrar-abono" data-goal="${goalId}" data-id="${a.id}" title="Eliminar">🗑️</button>
              </div>`).join('');
          cont.querySelectorAll('.borrar-abono').forEach((b) => b.addEventListener('click', async () => {
            if (!confirm('¿Eliminar este abono?')) return;
            await apiDel(`/api/goals/${b.dataset.goal}/contributions/${b.dataset.id}`);
            renderMetas();
          }));
        } catch (err) { cont.innerHTML = `<p class="detalle">Error: ${esc(err.message)}</p>`; }
      });
    });

    lista.querySelectorAll('.agregar-abono').forEach((b) => b.addEventListener('click', async () => {
      const item = b.closest('.item');
      try {
        await apiPost(`/api/goals/${b.dataset.id}/contributions`, {
          amount: Number(item.querySelector('.abono-monto').value) || 0,
          fecha: item.querySelector('.abono-fecha').value,
          nota: item.querySelector('.abono-nota').value.trim(),
        });
        renderMetas();
      } catch (err) { alert('No se pudo registrar el abono: ' + err.message); }
    }));

    lista.querySelectorAll('.borrar-meta').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta meta y sus abonos?')) return;
      await apiDel('/api/goals/' + b.dataset.id);
      renderMetas();
    }));
  } catch (err) {
    lista.innerHTML = `<p class="vacio">No se pudo cargar: ${esc(err.message)}</p>`;
  }
}

// ---------- Arranque ---------------------------------------------
async function recargarCatalogo() {
  catalogo = await apiGet('/api/catalog');
}

(async function init() {
  document.getElementById('selector-mes').value = mesSel;
  alternarCamposOperacion();
  try {
    await recargarCatalogo();
    renderPanel();
  } catch (err) {
    document.getElementById('tarjetas-panel').innerHTML =
      `<p class="vacio">No se pudo conectar con el servidor: ${esc(err.message)}</p>`;
  }
})();
