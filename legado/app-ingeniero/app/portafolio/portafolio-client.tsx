'use client';

import { useState, useEffect, useMemo } from 'react';
import { Briefcase, Plus, Trash2, Loader2, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { FIBRAS_DATA, SECTOR_COLORS } from '@/lib/fibras-data';
import { getSessionId } from '@/lib/session';

const PIE_COLORS = ['#e8003a', '#0099ff', '#1D9E75', '#9b59b6', '#ff9800', '#1abc9c', '#3f51b5', '#cddc39', '#ff6b00', '#795548', '#00bcd4', '#f39c12', '#607d8b', '#4caf50', '#e67e22', '#00897b'];

export default function PortafolioClient() {
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addTicker, setAddTicker] = useState('FUNO11');
  const [addAmount, setAddAmount] = useState('');

  const loadPortfolio = () => {
    const sid = getSessionId();
    if (!sid) { setLoading(false); return; }
    fetch(`/api/portfolio?sessionId=${sid}`)
      .then((r) => r.json())
      .then((res) => setPortfolio(res?.portfolio ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPortfolio(); }, []);

  const addToPortfolio = async () => {
    const sid = getSessionId();
    if (!sid || !addAmount) return;
    try {
      await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, ticker: addTicker, amountInvested: parseFloat(addAmount) }),
      });
      toast.success('FIBRA añadida al portafolio');
      setAddAmount('');
      loadPortfolio();
    } catch {
      toast.error('Error');
    }
  };

  const removeFromPortfolio = async (id: string) => {
    try {
      await fetch(`/api/portfolio?id=${id}`, { method: 'DELETE' });
      setPortfolio((prev) => (prev ?? []).filter((p: any) => p?.id !== id));
      toast.success('Eliminado del portafolio');
    } catch {
      toast.error('Error');
    }
  };

  const total = useMemo(() => {
    return (portfolio ?? []).reduce((sum: number, p: any) => sum + (Number(p?.amountInvested) || 0), 0);
  }, [portfolio]);

  const pieData = useMemo(() => {
    return (portfolio ?? []).map((p: any) => {
      const fibra = FIBRAS_DATA.find((f) => f.ticker === p?.ticker);
      return {
        name: (p?.ticker ?? '').replace(/\d+/g, ''),
        value: Number(p?.amountInvested) || 0,
        sector: fibra?.sector ?? '',
      };
    });
  }, [portfolio]);

  const projectedDividends = useMemo(() => {
    return (portfolio ?? []).reduce((sum: number, p: any) => {
      const fibra = FIBRAS_DATA.find((f) => f.ticker === p?.ticker);
      const divPerCert = parseFloat((fibra?.staticDiv ?? '0').replace('$', ''));
      const estimatedPrice = 25;
      const certs = Math.floor((Number(p?.amountInvested) || 0) / estimatedPrice);
      return sum + certs * divPerCert;
    }, 0);
  }, [portfolio]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#888]" size={32} />
      </div>
    );
  }

  return (
    <main className="max-w-[1100px] mx-auto px-3 py-4 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-[18px] bg-[#e8003a] rounded-sm" />
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '28px', letterSpacing: '1px' }}>Simulador de Portafolio</h1>
      </div>
      <p className="text-[#888] text-xs mb-6">Arma tu portafolio de FIBRAs y visualiza la distribución</p>

      {/* Add form */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-[#101010] border border-[#222] rounded-[10px] p-4 mb-4">
        <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
          <Plus size={16} className="text-[#e8003a]" /> Añadir FIBRA
        </h3>
        <div className="flex gap-2 items-end flex-wrap">
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] text-[#888] font-semibold uppercase mb-1 block">FIBRA</label>
            <select
              value={addTicker}
              onChange={(e) => setAddTicker(e.target?.value ?? 'FUNO11')}
              className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white outline-none"
            >
              {FIBRAS_DATA.map((f) => (
                <option key={f.ticker} value={f.ticker}>{f.ticker.replace(/\d+/g, '')} — {f.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="text-[10px] text-[#888] font-semibold uppercase mb-1 block">Monto (MXN)</label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
              <input
                type="number"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target?.value ?? '')}
                className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg pl-8 pr-3 py-2 text-sm text-white outline-none"
                placeholder="50000"
              />
            </div>
          </div>
          <button onClick={addToPortfolio} className="px-4 py-2 bg-[#e8003a] text-white text-sm font-bold rounded-lg hover:bg-[#ff1a50] transition-colors">
            Añadir
          </button>
        </div>
      </motion.div>

      {(portfolio?.length ?? 0) > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pie Chart */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#101010] border border-[#222] rounded-[10px] p-4">
            <h3 className="text-sm font-bold mb-3">Distribución</h3>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value">
                    {(pieData ?? []).map((_: any, i: number) => (
                      <Cell key={i} fill={PIE_COLORS?.[i % PIE_COLORS.length] ?? '#e8003a'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: '8px', fontSize: 11 }}
                    formatter={(v: any) => [`$${Number(v)?.toLocaleString?.() ?? '0'}`, 'Inversión']}
                  />
                  <Legend verticalAlign="top" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-[#181818] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#888] font-semibold uppercase">Total Invertido</div>
                <div className="text-lg font-bold text-[#f2f2f2] mt-1">${total?.toLocaleString?.() ?? '0'}</div>
              </div>
              <div className="bg-[#181818] rounded-lg p-3 text-center">
                <div className="text-[10px] text-[#888] font-semibold uppercase">Div. Anual Est.</div>
                <div className="text-lg font-bold text-[#1D9E75] mt-1">${projectedDividends?.toLocaleString?.(undefined, { maximumFractionDigits: 0 }) ?? '0'}</div>
              </div>
            </div>
          </motion.div>

          {/* List */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#101010] border border-[#222] rounded-[10px] p-4">
            <h3 className="text-sm font-bold mb-3">Posiciones</h3>
            <div className="space-y-2">
              {(portfolio ?? []).map((p: any, i: number) => {
                const fibra = FIBRAS_DATA.find((f) => f.ticker === p?.ticker);
                const col = SECTOR_COLORS?.[fibra?.sector ?? ''] ?? '#e8003a';
                const pct = total > 0 ? ((Number(p?.amountInvested) || 0) / total) * 100 : 0;
                return (
                  <div key={p?.id ?? i} className="flex items-center justify-between bg-[#181818] rounded-lg px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS?.[i % PIE_COLORS.length] }} />
                      <div>
                        <span className="text-xs font-bold" style={{ color: col }}>{(p?.ticker ?? '').replace(/\d+/g, '')}</span>
                        <span className="text-[10px] text-[#888] ml-2">{fibra?.sector ?? ''}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-bold">${Number(p?.amountInvested)?.toLocaleString?.() ?? '0'}</div>
                        <div className="text-[10px] text-[#888]">{pct?.toFixed?.(1) ?? '0'}%</div>
                      </div>
                      <button onClick={() => removeFromPortfolio(p?.id)} className="text-[#555] hover:text-[#e8003a] transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {(portfolio?.length ?? 0) === 0 && (
        <div className="bg-[#101010] border border-[#222] rounded-[10px] p-10 text-center">
          <Briefcase size={40} className="mx-auto text-[#333] mb-3" />
          <p className="text-[#888] text-sm">Tu portafolio está vacío. Añade FIBRAs para comenzar.</p>
        </div>
      )}
    </main>
  );
}
