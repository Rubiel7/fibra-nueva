export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FIBRAS_DATA } from '@/lib/fibras-data';
import { getHistorical } from '@/lib/yahoo-finance';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  const ticker = params?.ticker;
  const period = request.nextUrl?.searchParams?.get('period') ?? '30d';
  const fibra = FIBRAS_DATA.find((f) => f.ticker === ticker);
  if (!fibra) {
    return NextResponse.json({ error: 'FIBRA no encontrada' }, { status: 404 });
  }

  const data = await getHistorical(fibra.yahooTicker, period);
  return NextResponse.json({ data });
}
