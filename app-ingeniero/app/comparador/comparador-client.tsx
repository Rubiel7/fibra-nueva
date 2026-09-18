'use client';

import { useState, useEffect } from 'react';
import { GitCompare, Plus, X, Loader2, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { FIBRAS_DATA, SECTOR_COLORS } from '@/lib/fibras-data';
import { motion } from 'framer-motion';

const CHART_COLORS = ['#e8003a', '#0099ff', '#1D9E75'];

export default function ComparadorClient() {
  const [selected, setSelected] = useState<string[]>([]);
  const [fibraData, setFibraData] = useState<Record<string, any>>({});
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [period, setPeriod] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const addFibra = (ticker: string) => {
    if ((selected?.length ?? 0) >= 3 || (selected ?? []).includes(ticker)) return;
    setSelected((prev) => [...(prev ?? []), ticker]);
  };

  const removeFibra = (ticker: string) => {
    setSelected((prev) => (prev ?? []).filter((t) => t !== ticker));
  };

  // Fetch quote data for selected fibras
  useEffect(() => {
    (selected ?? []).forEach((ticker) => {
      if (fibraData?.[ticker]) return;
      fetch(`/api/fibras/${ticker}`)
        .then((r) => r.json())
        .then((data) => setFibraData((prev) => ({ ...(prev ?? {}), [ticker]: data })))
        .catch(() => {});
    });
  }, [selected]);

  // Fetch historical data for chart
  useEffect(() => {
    if ((selected?.length ?? 0) === 0) {
      setHistoricalData([]);
      return;
    }
    setLoading(true);
    Promise.all(
      (selected ?? []).map((ticker) =>
        fetch(`/api/historical/${ticker}?period=${period}`)
          .then((r) => r.json())
          .then((res) => ({ ticker, data: res?.data ?? [] }))
          .catch(() => ({ ticker, data: [] }))
      )
    ).then((results) => {
      // Merge data by date
      const dateMap: Record<string, any> = {};
      (results ?? []).forEach((r: any) => {
        (r?.data ?? []).forEach((d: any) => {
          if (!dateMap[d?.date]) dateMap[d.date] = { date: d.date };
          dateMap[d.date][r.ticker] = d?.close ?? 0;
        });
      });
      const merged = Object.values(dateMap).sort((a: any, b: any) => (a?.date ?? '').localeCompare(b?.date ?? ''));
      setHistoricalData(merged);
    }).finally(() => setLoading(false));
  }, [selected, period]);

  const exportCSV = () => {
    if ((selected?.length ?? 0) === 0) return;
    window.open(`/api/export?tickers=${selected.join(',')}`, '_blank');
  };

  const available = FIBRAS_DATA.filter((f) => !(selected ?? []).includes(f.ticker));

  return (
    <main className="max-w-[1100px] mx-auto px-3 py-4 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-[18px] bg-[#e8003a] rounded-sm" />
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '28px', letterSpacing: '1px' }}>Comparador</h1>
      </div>
      <p className="text-[#888] text-xs mb-6">Selecciona hasta 3 FIBRAs para comparar métricas lado a lado</p>

      {/* Selected chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(selected ?? []).map((ticker, i) => {
          const fibra = FIBRAS_DATA.find((f) => f.ticker === ticker);
          const col = SECTOR_COLORS?.[fibra?.sector ?? ''] ?? '#e8003a';
          return (
            <motion.div
              key={ticker}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold"
              style={{ background: `${col}20`, borderColor: `${col}50`, color: col }}
            >
              <span className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS?.[i] ?? col }} />
              {(ticker ?? '').replace(/\d+/g, '')}
              <button onClick={() => removeFibra(ticker)} className="ml-1 hover:opacity-70">
                <X size={12} />
              </button>
            </motion.div>
          );
        })}
        {(selected?.length ?? 0) < 3 && (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-dashed border-[#2e2e2e] text-xs font-semibold text-[#888] hover:border-[#444] hover:text-white transition-all"
            >
              <Plus size={12} /> Añadir FIBRA
            </button>
            {dropdownOpen && (
              <div className="absolute top-full mt-1 left-0 bg-[#181818] border border-[#2e2e2e] rounded-lg max-h-60 overflow-auto w-48 z-20 shadow-lg">
                {available.map((f) => (
                  <button
                    key={f.ticker}
                    onClick={() => { addFibra(f.ticker); setDropdownOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-[#222] transition-colors flex items-center gap-2"
                  >
                    <span className="font-bold" style={{ color: f.color }}>{f.ticker.replace(/\d+/g, '')}</span>
                    <span className="text-[#888]">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {(selected?.length ?? 0) > 0 && (
        <>
          {/* Comparison Table */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#101010] border border-[#222] rounded-[10px] overflow-hidden mb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#222]">
                    <th className="text-left px-4 py-3 text-[#888] font-semibold">Métrica</th>
                    {(selected ?? []).map((ticker, i) => (
                      <th key={ticker} className="text-center px-4 py-3 font-bold" style={{ color: CHART_COLORS?.[i] ?? '#fff' }}>
                        {ticker.replace(/\d+/g, '')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {['Precio', 'Div. Anual', 'Ocupación', 'Sector', 'Cambio %', 'Volumen', 'Cap. Mercado'].map((metric) => (
                    <tr key={metric} className="border-b border-[#181818] hover:bg-[#181818]/50">
                      <td className="px-4 py-2.5 text-[#888] font-semibold">{metric}</td>
                      {(selected ?? []).map((ticker) => {
                        const d = fibraData?.[ticker];
                        const staticData = FIBRAS_DATA.find((f) => f.ticker === ticker);
                        let val = 'N/A';
                        if (metric === 'Precio') val = d?.price != null ? `$${Number(d.price)?.toFixed?.(2)}` : 'N/A';
                        else if (metric === 'Div. Anual') val = staticData?.staticDiv ?? 'N/A';
                        else if (metric === 'Ocupación') val = staticData?.staticOcc ?? '—';
                        else if (metric === 'Sector') val = staticData?.sector ?? '';
                        else if (metric === 'Cambio %') val = d?.changePercent != null ? `${d.changePercent >= 0 ? '+' : ''}${Number(d.changePercent)?.toFixed?.(2)}%` : 'N/A';
                        else if (metric === 'Volumen') val = d?.volume != null ? Number(d.volume)?.toLocaleString?.() ?? '0' : 'N/A';
                        else if (metric === 'Cap. Mercado') {
                          const mc = d?.marketCap;
                          if (mc != null) {
                            const n = Number(mc);
                            if (n >= 1e9) val = `$${(n / 1e9)?.toFixed?.(1)}B`;
                            else if (n >= 1e6) val = `$${(n / 1e6)?.toFixed?.(1)}M`;
                            else val = `$${n?.toLocaleString?.()}`;
                          }
                        }
                        return <td key={ticker} className="text-center px-4 py-2.5 font-medium text-white">{val}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Chart */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#101010] border border-[#222] rounded-[10px] p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold">Precio Histórico Comparativo</h3>
              <div className="flex gap-1">
                {['30d', '90d', '1y', '5y'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                      period === p ? 'bg-[#e8003a] text-white' : 'bg-[#181818] text-[#888] hover:text-white'
                    }`}
                  >
                    {p === '30d' ? '30D' : p === '90d' ? '90D' : p === '1y' ? '1A' : '5A'}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-[250px]">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="animate-spin text-[#888]" size={24} />
                </div>
              ) : (historicalData?.length ?? 0) === 0 ? (
                <div className="flex items-center justify-center h-full text-[#555] text-sm">Sin datos</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 10 }} stroke="#333" interval="preserveStartEnd"
                      tickFormatter={(v: string) => { const p = (v ?? '').split('-'); return `${p?.[1] ?? ''}/${p?.[2] ?? ''}`; }}
                    />
                    <YAxis tickLine={false} tick={{ fontSize: 10 }} stroke="#333" width={50} tickFormatter={(v: number) => `$${v?.toFixed?.(0) ?? '0'}`} />
                    <Tooltip contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: '8px', fontSize: 11 }} />
                    <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                    {(selected ?? []).map((ticker, i) => (
                      <Line key={ticker} type="monotone" dataKey={ticker} stroke={CHART_COLORS?.[i] ?? '#fff'} strokeWidth={2} dot={false} name={ticker.replace(/\d+/g, '')} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </motion.div>

          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2.5 bg-[#181818] border border-[#2e2e2e] rounded-lg text-sm font-semibold text-[#888] hover:text-white transition-all">
            <Download size={16} /> Exportar comparativa CSV
          </button>
        </>
      )}

      {(selected?.length ?? 0) === 0 && (
        <div className="bg-[#101010] border border-[#222] rounded-[10px] p-10 text-center">
          <GitCompare size={40} className="mx-auto text-[#333] mb-3" />
          <p className="text-[#888] text-sm">Selecciona FIBRAs para comenzar a comparar</p>
        </div>
      )}
    </main>
  );
}
