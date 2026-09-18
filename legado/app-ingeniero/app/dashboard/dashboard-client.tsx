'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, BarChart3, Building2, Loader2, Star, Bell, Trash2 } from 'lucide-react';
import { SECTOR_COLORS } from '@/lib/fibras-data';
import { getSessionId } from '@/lib/session';
import { toast } from 'sonner';

export default function DashboardClient() {
  const [fibras, setFibras] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/fibras').then(r => r.json()),
    ]).then(([fibrasRes]) => {
      setFibras(fibrasRes?.fibras ?? []);
    }).catch(() => {}).finally(() => setLoading(false));

    const sid = getSessionId();
    if (sid) {
      fetch(`/api/favorites?sessionId=${sid}`)
        .then(r => r.json())
        .then(res => setFavorites(res?.favorites ?? []))
        .catch(() => {});
      fetch(`/api/alerts?sessionId=${sid}`)
        .then(r => r.json())
        .then(res => setAlerts(res?.alerts ?? []))
        .catch(() => {});
    }
  }, []);

  const deleteAlert = async (id: string) => {
    try {
      await fetch(`/api/alerts?id=${id}`, { method: 'DELETE' });
      setAlerts(prev => (prev ?? []).filter((a: any) => a?.id !== id));
      toast.success('Alerta eliminada');
    } catch {
      toast.error('Error');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#888]" size={32} />
      </div>
    );
  }

  // Top performers by price change
  const withChange = (fibras ?? []).filter((f: any) => f?.changePercent != null);
  const topGainers = [...withChange].sort((a: any, b: any) => (b?.changePercent ?? 0) - (a?.changePercent ?? 0)).slice(0, 5);
  const topLosers = [...withChange].sort((a: any, b: any) => (a?.changePercent ?? 0) - (b?.changePercent ?? 0)).slice(0, 5);
  const topVolume = [...(fibras ?? [])].filter((f: any) => f?.volume != null).sort((a: any, b: any) => (b?.volume ?? 0) - (a?.volume ?? 0)).slice(0, 5);
  const topMarketCap = [...(fibras ?? [])].filter((f: any) => f?.marketCap != null).sort((a: any, b: any) => (b?.marketCap ?? 0) - (a?.marketCap ?? 0)).slice(0, 5);

  const StatCard = ({ title, icon: Icon, items, valueKey, format, colorFn }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#101010] border border-[#222] rounded-[10px] p-4"
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-[#e8003a]" />
        <h3 className="text-sm font-bold">{title}</h3>
      </div>
      {(items ?? []).length === 0 ? (
        <p className="text-[#555] text-xs">Sin datos disponibles</p>
      ) : (
        <div className="space-y-2">
          {(items ?? []).map((f: any, i: number) => {
            const col = SECTOR_COLORS?.[f?.sector] ?? '#e8003a';
            return (
              <div key={f?.ticker ?? i} className="flex items-center justify-between bg-[#181818] rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold" style={{ color: col }}>{(f?.ticker ?? '').replace(/\d+/g, '')}</span>
                  <span className="text-[10px] text-[#888]">{f?.name ?? ''}</span>
                </div>
                <span className={`text-xs font-bold ${colorFn?.(f) ?? ''}`}>
                  {format?.(f?.[valueKey]) ?? f?.[valueKey] ?? ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  return (
    <main className="max-w-[1100px] mx-auto px-3 py-4 pb-10">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-[3px] h-[18px] bg-[#e8003a] rounded-sm" />
        <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '28px', letterSpacing: '1px' }}>Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Top Rendimientos"
          icon={TrendingUp}
          items={topGainers}
          valueKey="changePercent"
          format={(v: any) => `${v >= 0 ? '+' : ''}${Number(v)?.toFixed?.(2) ?? '0'}%`}
          colorFn={(f: any) => (f?.changePercent ?? 0) >= 0 ? 'text-[#1D9E75]' : 'text-[#e8003a]'}
        />
        <StatCard
          title="Mayores Caídas"
          icon={TrendingUp}
          items={topLosers}
          valueKey="changePercent"
          format={(v: any) => `${v >= 0 ? '+' : ''}${Number(v)?.toFixed?.(2) ?? '0'}%`}
          colorFn={(f: any) => (f?.changePercent ?? 0) >= 0 ? 'text-[#1D9E75]' : 'text-[#e8003a]'}
        />
        <StatCard
          title="Mayor Volumen"
          icon={BarChart3}
          items={topVolume}
          valueKey="volume"
          format={(v: any) => Number(v)?.toLocaleString?.() ?? '0'}
          colorFn={() => 'text-[#f2f2f2]'}
        />
        <StatCard
          title="Mayor Capitalización"
          icon={Building2}
          items={topMarketCap}
          valueKey="marketCap"
          format={(v: any) => {
            const n = Number(v) ?? 0;
            if (n >= 1e9) return `$${(n / 1e9)?.toFixed?.(1) ?? '0'}B`;
            if (n >= 1e6) return `$${(n / 1e6)?.toFixed?.(1) ?? '0'}M`;
            return `$${n?.toLocaleString?.() ?? '0'}`;
          }}
          colorFn={() => 'text-[#f2f2f2]'}
        />
      </div>

      {/* Favorites */}
      <div className="bg-[#101010] border border-[#222] rounded-[10px] p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Star size={16} className="text-[#e8003a]" />
          <h3 className="text-sm font-bold">Mis Favoritos</h3>
        </div>
        {(favorites?.length ?? 0) === 0 ? (
          <p className="text-[#555] text-xs">No tienes FIBRAs favoritas aún. Ve a la página principal para añadir.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(favorites ?? []).map((fav: any) => (
              <span key={fav?.id} className="bg-[#181818] border border-[#2e2e2e] rounded-full px-3 py-1 text-xs font-semibold text-[#f2f2f2]">
                {(fav?.ticker ?? '').replace(/\d+/g, '')}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Alerts */}
      <div className="bg-[#101010] border border-[#222] rounded-[10px] p-4">
        <div className="flex items-center gap-2 mb-3">
          <Bell size={16} className="text-[#e8003a]" />
          <h3 className="text-sm font-bold">Mis Alertas de Precio</h3>
        </div>
        {(alerts?.length ?? 0) === 0 ? (
          <p className="text-[#555] text-xs">No tienes alertas activas. Ve al detalle de una FIBRA para crear una.</p>
        ) : (
          <div className="space-y-2">
            {(alerts ?? []).map((alert: any) => (
              <div key={alert?.id} className="flex items-center justify-between bg-[#181818] rounded-lg px-3 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-[#e8003a]">{(alert?.ticker ?? '').replace(/\d+/g, '')}</span>
                  <span className="text-[10px] text-[#888]">
                    {alert?.alertType === 'above' ? 'Por encima de' : 'Por debajo de'} ${Number(alert?.targetPrice)?.toFixed?.(2) ?? '0'}
                  </span>
                </div>
                <button onClick={() => deleteAlert(alert?.id)} className="text-[#555] hover:text-[#e8003a] transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
