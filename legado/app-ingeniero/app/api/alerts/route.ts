export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl?.searchParams?.get('sessionId') ?? '';
  if (!sessionId) return NextResponse.json({ alerts: [] });

  const alerts = await prisma.priceAlert.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ alerts });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, ticker, targetPrice, alertType } = body ?? {};
    if (!sessionId || !ticker || targetPrice == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const alert = await prisma.priceAlert.create({
      data: {
        sessionId,
        ticker,
        targetPrice: Number(targetPrice),
        alertType: alertType ?? 'above',
      },
    });
    return NextResponse.json({ alert });
  } catch (error: any) {
    console.error('Alerts error:', error?.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl?.searchParams?.get('id') ?? '';
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    await prisma.priceAlert.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete alert error:', error?.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
