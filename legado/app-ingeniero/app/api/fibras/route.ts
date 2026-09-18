export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { FIBRAS_DATA } from '@/lib/fibras-data';
import { getQuote } from '@/lib/yahoo-finance';
import { getSaTafeData } from '@/lib/sa-tafe';

export async function GET() {
  try {
    // Fetch SA-TAFE data in parallel with Yahoo Finance
    const [saTafeData, ...quoteResults] = await Promise.all([
      getSaTafeData(),
      ...FIBRAS_DATA.map((fibra) => getQuote(fibra.yahooTicker).catch(() => null)),
    ]);

    const fibras = FIBRAS_DATA.map((fibra, i) => {
      const quote = quoteResults[i];
      const saData = (saTafeData as Record<string, any>)?.[fibra.ticker] ?? null;

      return {
        ...fibra,
        price: quote?.price ?? saData?.precio ?? null,
        previousClose: quote?.previousClose ?? null,
        change: quote?.change ?? null,
        changePercent: quote?.changePercent ?? null,
        volume: quote?.volume ?? null,
        marketCap: quote?.marketCap ?? null,
        fiftyTwoWeekHigh: quote?.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: quote?.fiftyTwoWeekLow ?? null,
        // SA-TAFE enrichment
        saAction: saData?.accion ?? null,
        saYield: saData?.yield ?? null,
        saScore: saData?.score ?? null,
        saFFO: saData?.ffo ?? null,
        saTimestamp: saData?.timestamp ?? null,
      };
    });

    return NextResponse.json({ fibras });
  } catch (error: any) {
    console.error('Error fetching fibras:', error?.message);
    return NextResponse.json({ fibras: FIBRAS_DATA }, { status: 200 });
  }
}
