export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FIBRAS_DATA } from '@/lib/fibras-data';
import { getQuote } from '@/lib/yahoo-finance';
import { getSaTafeData } from '@/lib/sa-tafe';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params?.ticker;
  const fibra = FIBRAS_DATA.find((f) => f.ticker === ticker);
  if (!fibra) {
    return NextResponse.json({ error: 'FIBRA no encontrada' }, { status: 404 });
  }

  const [quote, saTafeData] = await Promise.all([
    getQuote(fibra.yahooTicker).catch(() => null),
    getSaTafeData(),
  ]);

  const saData = saTafeData?.[ticker] ?? null;

  return NextResponse.json({
    ...fibra,
    price: quote?.price ?? saData?.precio ?? null,
    previousClose: quote?.previousClose ?? null,
    change: quote?.change ?? null,
    changePercent: quote?.changePercent ?? null,
    volume: quote?.volume ?? null,
    marketCap: quote?.marketCap ?? null,
    fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? null,
    fiftyTwoWeekLow: quote?.fiftyTwoWeekLow ?? null,
    saAction: saData?.accion ?? null,
    saYield: saData?.yield ?? null,
    saScore: saData?.score ?? null,
    saFFO: saData?.ffo ?? null,
  });
}
