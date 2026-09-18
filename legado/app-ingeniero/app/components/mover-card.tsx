'use client';

import { SECTOR_COLORS } from '@/lib/fibras-data';

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt((hex ?? '#000000').slice(1, 3), 16);
  const g = parseInt((hex ?? '#000000').slice(3, 5), 16);
  const b = parseInt((hex ?? '#000000').slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function MoverCard({ fibra, onClick }: { fibra: any; onClick?: () => void }) {
  const col = SECTOR_COLORS?.[fibra?.sector] ?? '#e8003a';
  const tickerClean = (fibra?.ticker ?? '').replace(/\d+/g, '');
  const price = fibra?.price != null ? `$${Number(fibra.price).toFixed(2)}` : (fibra?.staticDiv ?? 'N/A');

  return (
    <div
      onClick={onClick}
      className="flex-shrink-0 bg-[#101010] border border-[#222] rounded-[7px] px-3.5 py-2.5 cursor-pointer transition-all hover:border-[#2e2e2e] hover:-translate-y-0.5 min-w-[105px]"
      style={{ borderColor: hexToRgba(col, 0.2) }}
    >
      <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '17px', letterSpacing: '1px', lineHeight: 1, color: col, marginBottom: '3px' }}>
        {tickerClean}
      </div>
      <div className="text-[13px] font-bold text-[#1D9E75]">{price}</div>
      <div className="text-[10px] text-[#888] mt-0.5 font-medium">{fibra?.sector ?? ''}</div>
    </div>
  );
}
