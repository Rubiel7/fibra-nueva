'use client';

import { SECTORS } from '@/lib/fibras-data';

interface ChipBarProps {
  activeSector: string;
  onSelect: (sector: string) => void;
}

export default function ChipBar({ activeSector, onSelect }: ChipBarProps) {
  return (
    <div className="flex gap-1.5 overflow-auto py-2 scrollbar-hide">
      {SECTORS.map((sector) => (
        <button
          key={sector}
          onClick={() => onSelect?.(sector === 'Todas' ? 'all' : sector)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
            (sector === 'Todas' && activeSector === 'all') || sector === activeSector
              ? 'bg-[#e8003a] border-[#e8003a] text-white'
              : 'bg-[#181818] border-[#2e2e2e] text-[#888] hover:border-[#444] hover:text-[#f2f2f2]'
          }`}
        >
          {sector}
        </button>
      ))}
    </div>
  );
}
