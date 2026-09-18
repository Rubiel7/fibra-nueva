'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Download, TrendingUp, Activity } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ChipBar from './components/chip-bar';
import FibraCard from './components/fibra-card';
import MoverCard from './components/mover-card';
import { getSessionId } from '@/lib/session';

export default function HomeClient() {
  const [fibras, setFibras] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeSector, setActiveSector] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/fibras')
      .then((r) => r.json())
      .then((res) => setFibras(res?.fibras ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));

    const sid = getSessionId();
    if (sid) {
      fetch(`/api/favorites?sessionId=${sid}`)
        .then((r) => r.json())
        .then((res) => setFavorites((res?.favorites ?? []).map((f: any) => f?.ticker ?? '')))
        .catch(() => {});
    }
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return (fibras ?? []).filter((f: any) => {
      if (activeSector !== 'all' && f?.sector !== activeSector) return false;
      if (q && !(f?.ticker ?? '').toLowerCase().includes(q) && !(f?.name ?? '').toLowerCase().includes(q) && !(f?.fullName ?? '').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [fibras, activeSector, search]);

  const topDividends = useMemo(() => {
    return [...(fibras ?? [])]
      .sort((a: any, b: any) => {
        const ad = parseFloat((a?.staticDiv ?? '0').replace('$', ''));
        const bd = parseFloat((b?.staticDiv ?? '0').replace('$', ''));
        return bd - ad;
      })
      .slice(0, 8);
  }, [fibras]);

  // SA-TAFE summary stats
  const saStats = useMemo(() => {
    const withYield = (fibras ?? []).filter((f: any) => f?.saYield != null && f?.saYield !== 'N/A');
    const avgYield = withYield.length > 0 ? (withYield.reduce((s: number, f: any) => s + parseFloat(f.saYield), 0) / withYield.length).toFixed(2) : null;
    const comprar = (fibras ?? []).filter((f: any) => f?.saAction === 'COMPRAR').length;
    const mantener = (fibras ?? []).filter((f: any) => f?.saAction === 'MANTENER').length;
    return { avgYield, comprar, mantener };
  }, [fibras]);

  const toggleFavorite = async (ticker: string) => {
    const sid = getSessionId();
    if (!sid) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, ticker }),
      });
      const data = await res.json();
      if (data?.action === 'added') {
        setFavorites((prev) => [...(prev ?? []), ticker]);
        toast.success('Añadida a favoritos');
      } else {
        setFavorites((prev) => (prev ?? []).filter((t) => t !== ticker));
        toast.success('Eliminada de favoritos');
      }
    } catch {
      toast.error('Error al actualizar favoritos');
    }
  };

  const exportCSV = () => {
    window.open('/api/export', '_blank');
  };

  return (
    <main className="max-w-[1100px] mx-auto px-3 py-3 pb-10">
      {/* Search */}
      <div className="bg-[#101010] border border-[#2e2e2e] rounded-[10px] px-3.5 flex gap-2.5 items-center mb-3 focus-within:border-[#444] transition-colors">
        <Search size={16} className="opacity-45 flex-shrink-0" />
        <input
          type="search"
          placeholder="Buscar FIBRA por nombre o ticker…"
          value={search}
          onChange={(e) => setSearch(e.target?.value ?? '')}
          className="w-full border-none outline-none bg-transparent text-[#f2f2f2] text-[15px] py-3"
        />
        <span className="text-[#888] text-xs font-bold whitespace-nowrap">{filtered?.length ?? 0}</span>
      </div>

      {/* ChipBar moved here - below search */}
      <ChipBar activeSector={activeSector} onSelect={setActiveSector} />

      {/* SA-TAFE Quick Stats */}
      {saStats.avgYield && (
        <div className="flex gap-2 mt-3 mb-1 overflow-auto scrollbar-hide">
          <div className="flex items-center gap-2 bg-[#101010] border border-[#222] rounded-lg px-3 py-2 min-w-fit">
            <TrendingUp size={14} className="text-[#1D9E75]" />
            <span className="text-[11px] text-[#888]">Yield Prom.</span>
            <span className="text-[13px] font-bold text-[#1D9E75]">{saStats.avgYield}%</span>
          </div>
          <div className="flex items-center gap-2 bg-[#101010] border border-[#222] rounded-lg px-3 py-2 min-w-fit">
            <Activity size={14} className="text-[#888]" />
            <span className="text-[11px] text-[#888]">Análisis SA-TAFE:</span>
            {saStats.comprar > 0 && <span className="text-[11px] font-bold text-[#1D9E75]">{saStats.comprar} Comprar</span>}
            <span className="text-[11px] font-bold text-[#888]">{saStats.mantener} Mantener</span>
          </div>
        </div>
      )}

      {/* Top Dividends */}
      <div className="flex items-center justify-between mt-4 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-[18px] bg-[#e8003a] rounded-sm" />
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '20px', letterSpacing: '0.8px', fontWeight: 400 }}>Mayores Dividendos</h2>
        </div>
        <span className="text-[#888] text-[11px] font-semibold">Top 8 por div. anual</span>
      </div>
      <div className="flex gap-2 overflow-auto pb-2 scrollbar-hide mb-1">
        {topDividends.map((f: any) => (
          <MoverCard key={f?.ticker} fibra={f} onClick={() => router.push(`/fibra/${f?.ticker}`)} />
        ))}
      </div>

      {/* Grid */}
      <div className="flex items-center justify-between mt-4 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-[3px] h-[18px] bg-[#e8003a] rounded-sm" />
          <h2 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '20px', letterSpacing: '0.8px', fontWeight: 400 }}>Explorar FIBRAs</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#181818] border border-[#2e2e2e] text-[#888] hover:text-white transition-all"
          >
            <Download size={12} />
            CSV
          </button>
          <span className="text-[#888] text-[11px] font-semibold">{filtered?.length ?? 0} FIBRAs</span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="bg-[#101010] border border-[#222] rounded-[10px] animate-pulse" style={{ aspectRatio: '3/5' }} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-2.5">
          {filtered.map((f: any) => (
            <FibraCard
              key={f?.ticker}
              fibra={f}
              isFavorite={(favorites ?? []).includes(f?.ticker)}
              onToggleFavorite={() => toggleFavorite(f?.ticker)}
              onClick={() => router.push(`/fibra/${f?.ticker}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
