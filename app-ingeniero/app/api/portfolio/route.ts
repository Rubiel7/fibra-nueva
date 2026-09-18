export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl?.searchParams?.get('sessionId') ?? '';
  if (!sessionId) return NextResponse.json({ portfolio: [] });

  const portfolio = await prisma.portfolio.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ portfolio });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, ticker, amountInvested } = body ?? {};
    if (!sessionId || !ticker || amountInvested == null) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const item = await prisma.portfolio.upsert({
      where: { sessionId_ticker: { sessionId, ticker } },
      update: { amountInvested: Number(amountInvested) },
      create: { sessionId, ticker, amountInvested: Number(amountInvested) },
    });
    return NextResponse.json({ item });
  } catch (error: any) {
    console.error('Portfolio error:', error?.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl?.searchParams?.get('id') ?? '';
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });
    await prisma.portfolio.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete portfolio error:', error?.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
