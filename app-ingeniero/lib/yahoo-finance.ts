import YahooFinance from 'yahoo-finance2';

const yahooFinance = new (YahooFinance as any)({ suppressNotices: ['yahooSurvey'] });

// Simple in-memory cache
const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): any | null {
  const entry = cache?.[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any): void {
  cache[key] = { data, timestamp: Date.now() };
}

export async function getQuote(yahooTicker: string): Promise<any> {
  const cacheKey = `quote_${yahooTicker}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const result: any = await yahooFinance.quote(yahooTicker);
    const data = {
      price: result?.regularMarketPrice ?? null,
      previousClose: result?.regularMarketPreviousClose ?? null,
      change: result?.regularMarketChange ?? null,
      changePercent: result?.regularMarketChangePercent ?? null,
      volume: result?.regularMarketVolume ?? null,
      marketCap: result?.marketCap ?? null,
      fiftyTwoWeekHigh: result?.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: result?.fiftyTwoWeekLow ?? null,
      currency: result?.currency ?? 'MXN',
      name: result?.shortName ?? result?.longName ?? '',
    };
    setCache(cacheKey, data);
    return data;
  } catch (e: any) {
    console.error(`Error fetching quote for ${yahooTicker}:`, e?.message);
    return null;
  }
}

export async function getHistorical(
  yahooTicker: string,
  period: string
): Promise<{ date: string; close: number }[]> {
  const cacheKey = `hist_${yahooTicker}_${period}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const periodMap: Record<string, { period1: string; interval: string }> = {
    '30d': { period1: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0], interval: '1d' },
    '90d': { period1: new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0], interval: '1d' },
    '1y': { period1: new Date(Date.now() - 365 * 86400000).toISOString().split('T')[0], interval: '1wk' },
    '5y': { period1: new Date(Date.now() - 5 * 365 * 86400000).toISOString().split('T')[0], interval: '1mo' },
  };

  const config = periodMap?.[period] ?? periodMap['30d'];

  try {
    const result: any = await yahooFinance.historical(yahooTicker, {
      period1: config.period1,
      interval: config.interval as any,
    });

    const data = ((result as any[]) ?? []).map((item: any) => ({
      date: new Date(item?.date).toISOString().split('T')[0],
      close: item?.close ?? 0,
    }));
    setCache(cacheKey, data);
    return data;
  } catch (e: any) {
    console.error(`Error fetching historical for ${yahooTicker}:`, e?.message);
    return [];
  }
}
