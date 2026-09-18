'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { SECTOR_COLORS } from '@/lib/fibras-data';
import Image from 'next/image';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt((hex ?? '#000000').slice(1, 3), 16);
  const g = parseInt((hex ?? '#000000').slice(3, 5), 16);
  const b = parseInt((hex ?? '#000000').slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

interface FibraCardProps {
  fibra: any;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  onClick?: () => void;
}

export default function FibraCard({ fibra, isFavorite, onToggleFavorite, onClick }: FibraCardProps) {
  const col = SECTOR_COLORS?.[fibra?.sector] ?? fibra?.color ?? '#e8003a';
  const tickerClean = (fibra?.ticker ?? '').replace(/\d+/g, '');
  const price = fibra?.price != null ? `$${Number(fibra.price).toFixed(2)}` : (fibra?.staticDiv ?? 'N/A');
  const changePercent = fibra?.changePercent;
  const saAction = fibra?.saAction;
  const saYield = fibra?.saYield;

  const actionColor = saAction === 'COMPRAR' ? '#1D9E75' : saAction === 'VENDER' ? '#e8003a' : '#888';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#101010] border border-[#222] rounded-[10px] overflow-hidden cursor-pointer transition-all hover:border-[#333] hover:-translate-y-0.5 group relative"
      onClick={onClick}
    >
      {onToggleFavorite && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.();
          }}
          className="absolute top-2 right-2 z-10 p-1 rounded-full transition-colors"
          style={{ background: isFavorite ? hexToRgba('#e8003a', 0.3) : 'rgba(255,255,255,0.1)' }}
        >
          <Heart size={14} fill={isFavorite ? '#e8003a' : 'none'} stroke={isFavorite ? '#e8003a' : '#888'} />
        </button>
      )}
      <div
        className="w-full flex flex-col items-center justify-center gap-1.5 relative overflow-hidden"
        style={{
          aspectRatio: '3/4',
          background: `linear-gradient(160deg, ${hexToRgba(col, 0.18)} 0%, #181818 100%)`,
        }}
      >
        {/* Logo */}
        {fibra?.logo && (
          <div className="absolute top-2 left-2 z-10 w-8 h-8 rounded-md bg-white/90 flex items-center justify-center overflow-hidden">
            <div className="relative w-6 h-6">
              <Image
                src={fibra.logo}
                alt={`Logo ${fibra?.name ?? ''}`}
                fill
                className="object-contain"
                sizes="24px"
              />
            </div>
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center text-[70px] opacity-[0.05] pointer-events-none select-none">
          {fibra?.icon ?? ''}
        </div>
        <div
          className="z-10 text-center px-1.5 leading-tight"
          style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '20px', letterSpacing: '2px', color: '#fff' }}
        >
          {tickerClean}
        </div>
        <div
          className="z-10 text-[10px] font-bold px-2.5 py-0.5 rounded-full border"
          style={{
            background: hexToRgba(col, 0.18),
            color: col,
            borderColor: hexToRgba(col, 0.35),
          }}
        >
          {fibra?.sector ?? ''}
        </div>
        <div className="z-10 text-sm font-bold text-[#1D9E75]">{price}</div>
        {changePercent != null && (
          <div className={`z-10 text-[10px] font-semibold ${changePercent >= 0 ? 'text-[#1D9E75]' : 'text-[#e8003a]'}`}>
            {changePercent >= 0 ? '+' : ''}{Number(changePercent).toFixed(2)}%
          </div>
        )}
        <div className="z-10 text-[11px] text-white/50 font-medium">
          Ocup. {fibra?.staticOcc ?? '—'}
        </div>
        {/* SA-TAFE Action Badge */}
        {saAction && (
          <div
            className="z-10 text-[9px] font-bold px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: hexToRgba(actionColor, 0.2), color: actionColor, border: `1px solid ${hexToRgba(actionColor, 0.4)}` }}
          >
            {saAction}
          </div>
        )}
      </div>
      <div className="p-2">
        <div className="text-xs font-bold text-center whitespace-nowrap overflow-hidden text-ellipsis">
          {fibra?.name ?? ''}
        </div>
        {saYield != null && saYield !== 'N/A' && (
          <div className="text-[10px] text-[#1D9E75] text-center font-semibold mt-0.5">Yield {saYield}%</div>
        )}
      </div>
    </motion.div>
  );
}
