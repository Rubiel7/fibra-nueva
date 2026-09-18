'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const PERIODS = [
  { label: '30D', value: '30d' },
  { label: '90D', value: '90d' },
  { label: '1A', value: '1y' },
  { label: '5A', value: '5y' },
];

interface PriceChartProps {
  ticker: string;
  color?: string;
}

export default function PriceChart({ ticker, color = '#1D9E75' }: PriceChartProps) {
  const [period, setPeriod] = useState('30d');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    fetch(`/api/historical/${ticker}?period=${period}`)
      .then((r) => r.json())
      .then((res) => setData(res?.data ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [ticker, period]);

  return (
    <div className="bg-[#101010] border border-[#222] rounded-[10px] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-[#f2f2f2]">Precio Histórico</h3>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                period === p.value
                  ? 'bg-[#e8003a] text-white'
                  : 'bg-[#181818] text-[#888] hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="h-[200px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="animate-spin text-[#888]" size={24} />
          </div>
        ) : (data?.length ?? 0) === 0 ? (
          <div className="flex items-center justify-center h-full text-[#555] text-sm">
            Sin datos disponibles
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tickLine={false}
                tick={{ fontSize: 10 }}
                stroke="#333"
                interval="preserveStartEnd"
                tickFormatter={(v: string) => {
                  const parts = (v ?? '').split('-');
                  return `${parts?.[1] ?? ''}/${parts?.[2] ?? ''}`;
                }}
              />
              <YAxis
                tickLine={false}
                tick={{ fontSize: 10 }}
                stroke="#333"
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `$${v?.toFixed?.(1) ?? '0'}`}
                width={50}
              />
              <Tooltip
                contentStyle={{ background: '#181818', border: '1px solid #333', borderRadius: '8px', fontSize: 11 }}
                labelStyle={{ color: '#888' }}
                formatter={(v: any) => [`$${Number(v)?.toFixed?.(2) ?? '0'}`, 'Precio']}
              />
              <Line type="monotone" dataKey="close" stroke={color} strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
