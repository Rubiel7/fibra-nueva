export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const sessionId = request.nextUrl?.searchParams?.get('sessionId') ?? '';
  if (!sessionId) return NextResponse.json({ favorites: [] });

  const favorites = await prisma.favorite.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ favorites });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, ticker } = body ?? {};
    if (!sessionId || !ticker) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const existing = await prisma.favorite.findUnique({
      where: { sessionId_ticker: { sessionId, ticker } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ action: 'removed' });
    }

    const fav = await prisma.favorite.create({ data: { sessionId, ticker } });
    return NextResponse.json({ action: 'added', favorite: fav });
  } catch (error: any) {
    console.error('Favorites error:', error?.message);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
