'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Bell, TrendingUp, TrendingDown, Building2, Percent, DollarSign, BarChart3, Loader2, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { SECTOR_COLORS } from '@/lib/fibras-data';
import PriceChart from '@/app/components/price-chart';
import { getSessionId } from '@/lib/session';
import Image from 'next/image';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt((hex ?? '#000000').slice(1, 3), 16);
  const g = parseInt((hex ?? '#000000').slice(3, 5), 16);
  const b = parseInt((hex ?? '#000000').slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface AlertForm {
  targetPrice: string;
  alertType: string;
}

export default function FibraDetailClient({ ticker }: { ticker: string }) {
  const [fibra, setFibra] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFav, setIsFav] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertForm, setAlertForm] = useState<AlertForm>({ targetPrice: '', alertType: 'above' });
  const router = useRouter();

  useEffect(() => {
    if (!ticker) return;
    fetch(`/api/fibras/${ticker}`)
      .then((r) => r.json())
      .then((res) => setFibra(res))
      .catch(() => {})
      .finally(() => setLoading(false));

    const sid = getSessionId();
    if (sid) {
      fetch(`/api/favorites?sessionId=${sid}`)
        .then((r) => r.json())
        .then((res) => {
          const favs = (res?.favorites ?? []).map((f: any) => f?.ticker ?? '');
          setIsFav(favs.includes(ticker));
        })
        .catch(() => {});
    }
  }, [ticker]);

  const toggleFav = async () => {
    const sid = getSessionId();
    if (!sid) return;
    try {
      const res = await fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sid, ticker }),
      });
      const data = await res.json();
      setIsFav(data?.action === 'added');
      toast.success(data?.action === 'added' ? 'Añadida a favoritos' : 'Eliminada de favoritos');
    } catch {
      toast.error('Error');
    }
  };

  const createAlert = async () => {
    const sid = getSessionId();
    if (!sid || !alertForm?.targetPrice) return;
    try {
      await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sid,
          ticker,
          targetPrice: parseFloat(alertForm.targetPrice),
          alertType: alertForm.alertType,
        }),
      });
      toast.success('Alerta creada');
      setShowAlert(false);
      setAlertForm({ targetPrice: '', alertType: 'above' });
    } catch {
      toast.error('Error al crear alerta');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-[#888]" size={32} />
      </div>
    );
  }

  if (!fibra) {
    return (
      <div className="max-w-[1100px] mx-auto px-4 py-10 text-center">
        <p className="text-[#888]">FIBRA no encontrada</p>
        <button onClick={() => router.push('/')} className="mt-4 text-[#e8003a] text-sm font-semibold">Volver</button>
      </div>
    );
  }

  const col = SECTOR_COLORS?.[fibra?.sector] ?? fibra?.color ?? '#e8003a';
  const price = fibra?.price != null ? `$${Number(fibra.price).toFixed(2)}` : 'N/A';
  const change = fibra?.changePercent;
  const saAction = fibra?.saAction;
  const saYield = fibra?.saYield;
  const saFFO = fibra?.saFFO;
  const actionColor = saAction === 'COMPRAR' ? '#1D9E75' : saAction === 'VENDER' ? '#e8003a' : '#f39c12';

  const stats = [
    { label: 'Div. Anual', value: fibra?.staticDiv ?? 'N/A', icon: DollarSign, green: true },
    { label: 'Ocupación', value: fibra?.staticOcc ?? '—', icon: Percent },
    { label: 'Propiedades', value: fibra?.properties ?? 'N/A', icon: Building2 },
    { label: 'Volumen', value: fibra?.volume != null ? Number(fibra.volume).toLocaleString() : 'N/A', icon: BarChart3 },
    { label: 'Máx. 52 sem', value: fibra?.fiftyTwoWeekHigh != null ? `$${Number(fibra.fiftyTwoWeekHigh).toFixed(2)}` : 'N/A', icon: TrendingUp },
    { label: 'Mín. 52 sem', value: fibra?.fiftyTwoWeekLow != null ? `$${Number(fibra.fiftyTwoWeekLow).toFixed(2)}` : 'N/A', icon: TrendingDown },
  ];

  return (
    <main className="max-w-[1100px] mx-auto px-3 py-4 pb-10">
      {/* Back & Actions */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push('/')} className="flex items-center gap-1.5 text-[#888] hover:text-white text-sm font-semibold transition-colors">
          <ArrowLeft size={16} /> Volver
        </button>
        <div className="flex gap-2">
          <button onClick={toggleFav} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#181818] border border-[#2e2e2e] transition-all hover:border-[#444]">
            <Heart size={14} fill={isFav ? '#e8003a' : 'none'} stroke={isFav ? '#e8003a' : '#888'} />
            <span className="text-[#888]">{isFav ? 'Favorita' : 'Favorito'}</span>
          </button>
          <button onClick={() => setShowAlert(!showAlert)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#181818] border border-[#2e2e2e] transition-all hover:border-[#444] text-[#888]">
            <Bell size={14} /> Alerta
          </button>
        </div>
      </div>

      {/* Alert Form */}
      {showAlert && (
        <div className="bg-[#101010] border border-[#2e2e2e] rounded-[10px] p-4 mb-4">
          <h3 className="text-sm font-bold mb-3">Crear Alerta de Precio</h3>
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="text-[10px] text-[#888] font-semibold uppercase mb-1 block">Precio objetivo (MXN)</label>
              <input
                type="number"
                step="0.01"
                value={alertForm.targetPrice}
                onChange={(e) => setAlertForm((prev) => ({ ...(prev ?? {}), targetPrice: e.target?.value ?? '' }))}
                className="w-full bg-[#181818] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-[#444]"
                placeholder="ej. 25.50"
              />
            </div>
            <div>
              <label className="text-[10px] text-[#888] font-semibold uppercase mb-1 block">Tipo</label>
              <select
                value={alertForm.alertType}
                onChange={(e) => setAlertForm((prev) => ({ ...(prev ?? {}), alertType: e.target?.value ?? 'above' }))}
                className="bg-[#181818] border border-[#2e2e2e] rounded-lg px-3 py-2 text-sm text-white outline-none"
              >
                <option value="above">Por encima</option>
                <option value="below">Por debajo</option>
              </select>
            </div>
            <button onClick={createAlert} className="px-4 py-2 bg-[#e8003a] text-white text-sm font-bold rounded-lg hover:bg-[#ff1a50] transition-colors">
              Crear
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#101010] border border-[#222] rounded-[10px] overflow-hidden mb-4">
        <div className="p-4 flex items-center gap-3 border-b border-[#222]">
          {/* Logo */}
          {fibra?.logo ? (
            <div className="w-[52px] h-[52px] rounded-xl flex items-center justify-center flex-shrink-0 border bg-white/90 overflow-hidden p-1.5" style={{ borderColor: hexToRgba(col, 0.3) }}>
              <div className="relative w-10 h-10">
                <Image src={fibra.logo} alt={`Logo ${fibra?.name ?? ''}`} fill className="object-contain" sizes="40px" />
              </div>
            </div>
          ) : (
            <div
              className="w-[52px] h-[52px] rounded-xl flex items-center justify-center text-[26px] flex-shrink-0 border"
              style={{ background: hexToRgba(col, 0.15), borderColor: hexToRgba(col, 0.3) }}
            >
              {fibra?.icon ?? ''}
            </div>
          )}
          <div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '28px', letterSpacing: '1px', lineHeight: 1, color: col }}>
              {fibra?.ticker ?? ''}
            </div>
            <div className="text-[#888] text-xs mt-1">{fibra?.fullName ?? ''} · {fibra?.sector ?? ''}</div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-2xl font-bold">{price}</div>
            {change != null && (
              <div className={`text-sm font-semibold ${change >= 0 ? 'text-[#1D9E75]' : 'text-[#e8003a]'}`}>
                {change >= 0 ? '+' : ''}{Number(change).toFixed(2)}%
              </div>
            )}
          </div>
        </div>

        {/* SA-TAFE Analysis Badge */}
        {saAction && (
          <div className="px-4 py-2.5 border-b border-[#222] flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Shield size={14} style={{ color: actionColor }} />
              <span className="text-[11px] text-[#888] font-semibold">Análisis SA-TAFE:</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: hexToRgba(actionColor, 0.2), color: actionColor, border: `1px solid ${hexToRgba(actionColor, 0.4)}` }}
              >
                {saAction}
              </span>
            </div>
            {saYield != null && saYield !== 'N/A' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#888]">Yield:</span>
                <span className="text-xs font-bold text-[#1D9E75]">{saYield}%</span>
              </div>
            )}
            {saFFO != null && saFFO !== 'N/A' && saFFO !== 'N/D' && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#888]">FFO:</span>
                <span className="text-xs font-bold text-white">${Number(saFFO).toLocaleString()} M</span>
              </div>
            )}
          </div>
        )}

        <div className="p-3 text-xs text-white/65 leading-relaxed border-b border-[#222]">
          {fibra?.description ?? ''}
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 p-3">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-[#181818] rounded-[7px] p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Icon size={10} className="text-[#888]" />
                  <span className="text-[10px] text-[#888] font-semibold uppercase tracking-wide">{s.label}</span>
                </div>
                <div className={`text-base font-bold ${s.green ? 'text-[#1D9E75]' : ''}`}>{s.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Price Chart */}
      <PriceChart ticker={ticker} color={col} />
    </main>
  );
}
