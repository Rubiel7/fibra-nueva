import YahooFinance from "yahoo-finance2";

export type HistoryPeriod = "30d" | "90d" | "1y" | "5y";
export type HistoryPoint = { date: string; close: number };

const yahooFinance = new YahooFinance();
const DAY_MS = 86_400_000;

function periodMap(now: number): Record<HistoryPeriod, { period1: Date; interval: "1d" | "1wk" | "1mo" }> {
  return {
    "30d": { period1: new Date(now - 30 * DAY_MS), interval: "1d" },
    "90d": { period1: new Date(now - 90 * DAY_MS), interval: "1d" },
    "1y": { period1: new Date(now - 365 * DAY_MS), interval: "1wk" },
    "5y": { period1: new Date(now - 5 * 365 * DAY_MS), interval: "1mo" },
  };
}

export async function getHistorical(yahooTicker: string, period: HistoryPeriod = "30d"): Promise<HistoryPoint[]> {
  const { period1, interval } = periodMap(Date.now())[period];
  const result = await yahooFinance.chart(yahooTicker, { period1, interval });

  return (result?.quotes ?? [])
    .filter((item) => item?.close !== null && item?.close !== undefined && item?.date instanceof Date && !Number.isNaN(item.date.getTime()))
    .map((item) => ({
      date: new Date(item.date).toISOString().slice(0, 10),
      close: item.close ?? 0,
    }));
}
