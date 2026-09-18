// SA-TAFE Integration - Fetches analysis data from the GitHub repository

const SA_TAFE_DB_URL = 'https://raw.githubusercontent.com/rvalencia011-del/SA-TAFE/main/DATABASE_MASTER_SA_TAFE.json';
const SA_TAFE_TRAINING_URL = 'https://raw.githubusercontent.com/rvalencia011-del/SA-TAFE/main/TRAINING_DATA_FIBRAS.json';

let saTafeCache: { data: any; timestamp: number } | null = null;
let trainingCache: { data: any; timestamp: number } | null = null;
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export interface SaTafeData {
  precio: number | null;
  yield: number | null;
  score: number | null;
  accion: string;
  ffo: string | null;
  sector: string | null;
  timestamp: string | null;
}

export async function getSaTafeData(): Promise<Record<string, SaTafeData>> {
  if (saTafeCache && Date.now() - saTafeCache.timestamp < CACHE_TTL) {
    return saTafeCache.data;
  }

  try {
    const [dbRes, trainingRes] = await Promise.allSettled([
      fetch(SA_TAFE_DB_URL, { next: { revalidate: 600 } }),
      fetch(SA_TAFE_TRAINING_URL, { next: { revalidate: 600 } }),
    ]);

    let dbData: Record<string, any> = {};
    let trainingData: Record<string, any> = {};

    if (dbRes.status === 'fulfilled' && dbRes.value.ok) {
      const text = await dbRes.value.text();
      dbData = JSON.parse(text.replace(/NaN/g, 'null'));
    }

    if (trainingRes.status === 'fulfilled' && trainingRes.value.ok) {
      const text = await trainingRes.value.text();
      trainingData = JSON.parse(text.replace(/NaN/g, 'null'));
    }

    // Merge both datasets
    const result: Record<string, SaTafeData> = {};

    for (const [ticker, data] of Object.entries(dbData)) {
      const training = trainingData[ticker] ?? {};
      const d = data as any;
      const t = training as any;
      result[ticker] = {
        precio: d?.precio ?? null,
        yield: t?.yield ? parseFloat(t.yield) : null,
        score: d?.score ?? null,
        accion: d?.accion ?? 'MANTENER',
        ffo: t?.ffo ?? null,
        sector: t?.sector ?? null,
        timestamp: d?.t ?? null,
      };
    }

    saTafeCache = { data: result, timestamp: Date.now() };
    return result;
  } catch (error: any) {
    console.error('Error fetching SA-TAFE data:', error?.message);
    return {};
  }
}
