// Laboratorio cuantitativo — sección SA-TAFE (fibrasmx-2).
// Lee la corrida más reciente de la tabla `sa_tafe_runs` vía api.getSaTafeLatest.
// Los datos viven SOLO en esa tabla: actualizar = insertar una fila nueva
// (acción saveSaTafeRun), sin tocar este archivo ni reconstruir la sección.

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

type SaTafeTicker = {
  ticker: string;
  status: string;
  last_price: number | null;
  price_date: string | null;
  expected_return_26w: number | null;
  variance_26w: number | null;
  signal: string | null;
  signal_rank?: number | null;
};

type SaTafePayload = {
  run_date: string;
  price_cutoff: string;
  horizon_weeks: number;
  methodology?: string;
  signal_rule?: string;
  tickers: SaTafeTicker[];
  portfolio: { members: string[]; expected_return: number; variance: number; note?: string };
  notes?: string[];
};

const SHORT_NAMES: Record<string, string> = {
  FUNO11: "Fibra Uno", DANHOS13: "Fibra Danhos", FSHOP13: "Fibra Shop",
  FMTY14: "Fibra Monterrey", FIBRAMQ12: "Fibra Macquarie", FIBRAPL14: "Fibra Prologis",
  FNOVA17: "Fibra Nova", FINN13: "Fibra Inn", FIHO12: "Fibra Hotel",
  STORAGE18: "Fibra Storage", EDUCA18: "Fibra Educa", FCFE18: "Fibra CFE",
  FMX23: "FIBRAeMX", FPLUS16: "Fibra Plus", FIBRAUP18: "Fibra Upsite",
};

const MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];
const MES_CORTO = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];

function parseYMD(d: string) {
  const [y, m, dd] = d.split("-").map(Number);
  return { y, m, d: dd };
}
function fechaLarga(d: string) {
  const { y, m, d: dd } = parseYMD(d);
  return `${dd} de ${MESES[m - 1]} de ${y}`;
}
function fechaCorta(d: string) {
  const { y, m, d: dd } = parseYMD(d);
  return `${String(dd).padStart(2, "0")}-${MES_CORTO[m - 1]}-${y}`;
}
function pct(v: number) {
  return `${v > 0 ? "+" : ""}${(v * 100).toFixed(2)}%`;
}
function mxn(v: number) {
  return `$${v.toFixed(2)}`;
}
function fmtVar(v: number) {
  if (v === 0) return "0";
  if (Math.abs(v) < 0.0001) return v.toExponential(1).replace("e", "E");
  return String(Math.round(v * 1e6) / 1e6);
}

const SIX_LEARNERS = [
  ["Ingenuo", "repite el último precio observado."],
  ["Tendencia (drift)", "prolonga la tendencia promedio de la serie."],
  ["Estacional ingenuo", "repite el precio de hace 52 semanas."],
  ["Autorregresivo AR(p)", "usa los precios pasados como predictores."],
  ["Suavizamiento de Holt", "suaviza nivel y tendencia de la serie."],
  ["Promedio móvil 12s", "promedia las últimas 12 semanas."],
] as const;

export function SaTafeLabView() {
  const latest = useQuery({
    queryKey: ["sa-tafe-latest"],
    queryFn: () => api.getSaTafeLatest({}),
    staleTime: 5 * 60 * 1000,
  });
  const [howOpen, setHowOpen] = useState(false);

  if (latest.isPending) {
    return <section className="satafe" aria-label="Laboratorio cuantitativo"><div className="satafe-empty">Cargando laboratorio cuantitativo…</div></section>;
  }
  if (latest.isError || !latest.data?.run) {
    return <section className="satafe" aria-label="Laboratorio cuantitativo"><div className="satafe-empty"><p>No se pudo cargar la corrida SA-TAFE.</p><button onClick={() => latest.refetch()}>Reintentar</button></div></section>;
  }

  let payload: SaTafePayload | null = null;
  try {
    payload = JSON.parse(latest.data.run.payloadJson) as SaTafePayload;
  } catch {
    payload = null;
  }
  if (!payload || !Array.isArray(payload.tickers)) {
    return <section className="satafe" aria-label="Laboratorio cuantitativo"><div className="satafe-empty"><p>La corrida guardada no tiene el formato esperado.</p><button onClick={() => latest.refetch()}>Reintentar</button></div></section>;
  }

  const h = payload.horizon_weeks;
  const ok = payload.tickers
    .filter(t => t.status === "OK")
    .sort((a, b) => (a.signal_rank ?? 99) - (b.signal_rank ?? 99));
  const missing = payload.tickers.filter(t => t.status !== "OK");
  const port = payload.portfolio;

  return (
    <section className="satafe" aria-labelledby="satafe-title">
      <header className="satafe-hero">
        <p className="satafe-kicker">MODELO CUANTITATIVO · SA-TAFE</p>
        <h1 id="satafe-title">Laboratorio cuantitativo</h1>
        <p className="satafe-updated">
          Actualizado: {fechaLarga(latest.data.run.runDate)} · Corte de precios: {fechaCorta(latest.data.run.priceCutoff)} · Próxima corrida: cada lunes
        </p>
      </header>

      <aside className="satafe-disclaimer" role="note">
        <strong>Contenido con fines educativos.</strong> No constituye asesoría financiera ni recomendación de compra o venta.
        Las señales se presentan como “señal del modelo”.
      </aside>

      <section className="satafe-portfolio" aria-labelledby="satafe-port-title">
        <p className="satafe-kicker">PORTAFOLIO DEL MODELO</p>
        <h2 id="satafe-port-title">Miembros con señal COMPRAR</h2>
        <div className="satafe-chips" aria-label="FIBRAs en el portafolio del modelo">
          {port.members.map(m => <span key={m} className="satafe-chip">{m}</span>)}
        </div>
        <div className="satafe-kpis">
          <div><small>Retorno esperado ({h} semanas)</small><strong>{pct(port.expected_return)}</strong></div>
          <div><small>Varianza</small><strong>{fmtVar(port.variance)}</strong></div>
        </div>
        {port.note && <p className="satafe-note">{port.note}</p>}
      </section>

      <section aria-labelledby="satafe-table-title">
        <h2 id="satafe-table-title" className="satafe-h2">Señales por FIBRA · horizonte {h} semanas</h2>
        <div className="satafe-table-wrap">
          <table className="satafe-table">
            <thead>
              <tr><th scope="col">FIBRA</th><th scope="col">Precio de corte</th><th scope="col">Retorno esp. {h}s</th><th scope="col">Varianza</th><th scope="col">Señal del modelo</th></tr>
            </thead>
            <tbody>
              {ok.map(t => (
                <tr key={t.ticker}>
                  <td><b>{t.ticker}</b><small>{SHORT_NAMES[t.ticker] ?? ""}</small></td>
                  <td className="num">{t.last_price !== null ? mxn(t.last_price) : "—"}</td>
                  <td className="num"><b>{t.expected_return_26w !== null ? pct(t.expected_return_26w) : "—"}</b></td>
                  <td className="num">{t.variance_26w !== null ? fmtVar(t.variance_26w) : "—"}</td>
                  <td><span className="satafe-badge">{t.signal ?? "—"}</span></td>
                </tr>
              ))}
              {missing.map(t => (
                <tr key={t.ticker} className="satafe-row--na">
                  <td><b>{t.ticker}</b><small>Sin datos verificados</small></td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td className="num">—</td>
                  <td>
                    <span className="satafe-badge satafe-badge--na">NO VERIFICADO</span>
                    <small className="satafe-na-note">Yahoo devuelve otra empresa con este símbolo; no se inventan números.</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="satafe-source">Series semanales de Yahoo Finance · corte {fechaCorta(latest.data.run.priceCutoff)}. Regla de señales: tercios por retorno esperado a {h} semanas.</p>
      </section>

      <section className="satafe-how" aria-labelledby="satafe-how-title">
        <button
          id="satafe-how-title"
          className="satafe-how-toggle"
          onClick={() => setHowOpen(current => !current)}
          aria-expanded={howOpen}
          aria-controls="satafe-how-body"
        >
          <b>¿Cómo funciona?</b><span>{howOpen ? "Ocultar" : "Ver"}</span>
        </button>
        {howOpen && (
          <div className="satafe-how-body" id="satafe-how-body">
            <p><strong>TAFE</strong> son las siglas de <em>Threshold Accepting Forecasting Ensemble</em>: un método que combina 6 pronosticadores simples y reparte pesos entre ellos, buscando la mezcla que <strong>se hubiera equivocado menos en el pasado</strong>.</p>
            <p>Cada semana el modelo descarga el precio de cierre semanal de cada FIBRA en Yahoo Finance (hasta ~5 años de historia). Los 6 pronosticadores son:</p>
            <ol>
              {SIX_LEARNERS.map(([name, desc]) => <li key={name}><strong>{name}:</strong> {desc}</li>)}
            </ol>
            <p>Con una <strong>validación rolling de 26 semanas</strong> se mide el error de cada mezcla de pesos (error sMAPE). <strong>Threshold Accepting</strong> —una técnica de optimización— ajusta los pesos hasta minimizar ese error. Con la mezcla ganadora se pronostica el retorno a 26 semanas.</p>
            <p>Luego las 15 FIBRAs se ordenan de mayor a menor retorno esperado y se dividen en <strong>tercios</strong>: el tercio superior recibe la señal <strong>COMPRAR</strong>, el tercio medio <strong>MANTENER</strong> y el inferior <strong>VENDER</strong>. El portafolio del modelo es el promedio simple de las 5 FIBRAs del tercio COMPRAR.</p>
            <p className="satafe-paper"><strong>Base académica:</strong> Purata Aldaz et al., «Simulated Annealing Applied to Alternative Assets in Mexican Stock Exchange», <em>Mathematical and Computational Applications</em> 2026, 31(3), DOI 10.3390/mca31030080 (MDPI).</p>
            <div className="satafe-limits">
              <p><strong>Limitaciones honestas</strong></p>
              <ul>
                <li><strong>El modelo solo ve precios.</strong> No sabe de fusiones, emisiones de CBFIs, cambios de administración, resultados trimestrales, tasas de interés ni noticias. Un evento corporativo puede invalidar el pronóstico de un día para otro.</li>
                <li><strong>Los pronósticos fallan.</strong> Los pesos se ajustan al pasado, no al futuro; el propio paper reporta que el ensemble se degrada fuera de muestra cuando hay cambios de régimen. No es una bola de cristal.</li>
                <li><strong>NEXT25 queda sin datos</strong> porque Yahoo no devuelve la FIBRA correcta con ese símbolo; no se sustituye por otro ticker para no inventar datos.</li>
                <li><strong>Señal del modelo ≠ recomendación.</strong> Es un ejercicio cuantitativo con fines educativos, no asesoría financiera.</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      <footer className="satafe-foot">Contenido con fines educativos. No constituye asesoría financiera ni recomendación de compra o venta.</footer>
    </section>
  );
}
