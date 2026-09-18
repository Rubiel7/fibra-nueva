export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FIBRAS_DATA } from '@/lib/fibras-data';
import { getQuote } from '@/lib/yahoo-finance';
import { getSaTafeData } from '@/lib/sa-tafe';

export async function GET(request: NextRequest) {
  try {
    const tickers = request.nextUrl?.searchParams?.get('tickers')?.split(',') ?? FIBRAS_DATA.map(f => f.ticker);
    const saTafeData = await getSaTafeData();

    const rows: string[] = ['Ticker,Nombre,Sector,Precio,Div. Anual,Ocupación,Propiedades,Volumen,Cap. Mercado,Yield SA-TAFE,Acción SA-TAFE,FFO'];

    for (const ticker of tickers) {
      const fibra = FIBRAS_DATA.find(f => f.ticker === ticker);
      if (!fibra) continue;
      const quote = await getQuote(fibra.yahooTicker).catch(() => null);
      const saData = saTafeData?.[ticker];
      rows.push(
        [
          fibra.ticker,
          `"${fibra.fullName}"`,
          fibra.sector,
          quote?.price ?? saData?.precio ?? 'N/A',
          fibra.staticDiv,
          fibra.staticOcc,
          fibra.properties,
          quote?.volume ?? 'N/A',
          quote?.marketCap ?? 'N/A',
          saData?.yield ?? 'N/A',
          saData?.accion ?? 'N/A',
          saData?.ffo ?? 'N/A',
        ].join(',')
      );
    }

    const csv = rows.join('\n');
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="fibras_mx.csv"',
      },
    });
  } catch (error: any) {
    console.error('Export error:', error?.message);
    return NextResponse.json({ error: 'Error al exportar' }, { status: 500 });
  }
}
