'use client';

import { useState, useMemo } from 'react';
import { Calculator, DollarSign, TrendingUp, Percent } from 'lucide-react';
import { motion } from 'framer-motion';
import { FIBRAS_DATA, SECTOR_COLORS } from '@/lib/fibras-data';

export default function CalculadoraClient() {
  const [amount, setAmount] = useState('100000');
  const [selectedTicker, setSelectedTicker] = useState('FUNO11');

  const fibra = FIBRAS_DATA.find((f) => f.ticker === selectedTicker);
  const divAnual = parseFloat((fibra?.staticDiv ?? '0').replace('$', ''));
  const amountNum = parseFloat(amount) || 0;

  const results = useMemo(() => {
    if (!divAnual || !amountNum) return null;
    // Estimate: divAnual is per certificate, we estimate price ~20 MXN average for simplicity
    // Better: use actual price when available. For now use static approximation.
    const estimatedPrice = 25; // MXN average
    const certificates = Math.floor(amountNum / estimatedPrice);
    const annualDividend = certificates * divAnual;
    const monthlyDividend = annualDividend / 12;
    const yieldPercent = (annualDividend / amountNum) * 100;

    return {
      certificates,
      annualDividend,
      monthlyDividend,
      yieldPercent,
    };
  }, [amountNum, divAnual]);

  // Projection over 5 years (compound reinvestment)
  const projection = useMemo(() => {
    if (!results) return [];
    const years = [];
    let invested = amountNum;
    for (let i = 1; i <= 5; i++) {
      const div = invested * ((results?.yieldPercent ?? 0) / 100);
      invested += div;
      years.push({ year: i, value: invested, dividends: div });
    }
    return years;
  }, [results, amountNum]);

  const col = SECTOR_COLORS?.[fibra?.sector ?? ''] ?? '#e8003a';

  return (
    <main className="max-w-[1100px] mx-auto px-3 py-4 pb-10">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-[3px] h-[18px] bg-[#e8003a] rounded-sm" />
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '28px', letterSpacing: '1px' }}>Calculadora de Inversión</h1>
      </div>
      <p className="text-[#888] text-xs mb-6">Calcula los dividendos proyectados de tu inversión en FIBRAs</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#101010] border border-[#222] rounded-[10px] p-4">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <Calculator size={16} className="text-[#e8003a]" /> Parámetros
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-[#888] font-semibold uppercase mb-1.5 block">FIBRA</label>
              <select
                value={selectedTicker}
                onChange={(e) => setSelectedTicker(e.target?.value ?? 'FUNO11')}
                className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-[#444]"
              >
                {FIBRAS_DATA.map((f) => (
                  <option key={f.ticker} value={f.ticker}>
                    {f.ticker.replace(/\d+/g, '')} — {f.fullName} ({f.staticDiv}/cert)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-[#888] font-semibold uppercase mb-1.5 block">Monto a invertir (MXN)</label>
              <div className="relative">
                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]" />
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target?.value ?? '')}
                  className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg pl-8 pr-3 py-2.5 text-sm text-white outline-none focus:border-[#444]"
                  placeholder="100000"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 rounded-lg" style={{ background: `${col}15`, border: `1px solid ${col}30` }}>
            <div className="text-[10px] font-semibold uppercase text-[#888] mb-1">Dividendo por certificado</div>
            <div className="text-lg font-bold" style={{ color: col }}>{fibra?.staticDiv ?? 'N/A'} MXN/año</div>
          </div>
        </motion.div>

        {/* Results */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-[#101010] border border-[#222] rounded-[10px] p-4">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-[#1D9E75]" /> Resultados Proyectados
          </h3>
          {results ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[#181818] rounded-lg p-3">
                  <div className="text-[10px] text-[#888] font-semibold uppercase">Certificados</div>
                  <div className="text-xl font-bold text-[#f2f2f2] mt-1">{results.certificates?.toLocaleString?.() ?? '0'}</div>
                </div>
                <div className="bg-[#181818] rounded-lg p-3">
                  <div className="text-[10px] text-[#888] font-semibold uppercase">Yield Anual</div>
                  <div className="text-xl font-bold text-[#1D9E75] mt-1">{results.yieldPercent?.toFixed?.(1) ?? '0'}%</div>
                </div>
                <div className="bg-[#181818] rounded-lg p-3">
                  <div className="text-[10px] text-[#888] font-semibold uppercase">Div. Anual</div>
                  <div className="text-xl font-bold text-[#1D9E75] mt-1">${results.annualDividend?.toLocaleString?.(undefined, { maximumFractionDigits: 0 }) ?? '0'}</div>
                </div>
                <div className="bg-[#181818] rounded-lg p-3">
                  <div className="text-[10px] text-[#888] font-semibold uppercase">Div. Mensual</div>
                  <div className="text-xl font-bold text-[#1D9E75] mt-1">${results.monthlyDividend?.toLocaleString?.(undefined, { maximumFractionDigits: 0 }) ?? '0'}</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[10px] text-[#888] font-semibold uppercase mb-2">Proyección a 5 años (reinversión)</div>
                <div className="space-y-1.5">
                  {(projection ?? []).map((p: any) => (
                    <div key={p?.year} className="flex items-center justify-between bg-[#181818] rounded px-3 py-2">
                      <span className="text-xs text-[#888]">Año {p?.year}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-[#1D9E75]">+${p?.dividends?.toLocaleString?.(undefined, { maximumFractionDigits: 0 }) ?? '0'} div</span>
                        <span className="text-xs font-bold">${p?.value?.toLocaleString?.(undefined, { maximumFractionDigits: 0 }) ?? '0'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[#555] text-sm">Ingresa un monto para ver resultados</p>
          )}
        </motion.div>
      </div>
    </main>
  );
}
