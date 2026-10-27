import { apiClient } from "./apiClient";
import { getMarkets } from "./markets";
import type { Candle } from "../data/candles";
import type { ChartPeriod } from "../types/market";

interface ApiCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const chartIntervals: Record<
  ChartPeriod,
  { interval: string; limit: number; label: string }
> = {
  "1시간": { interval: "1m", limit: 60, label: "1분봉" },
  "1일": { interval: "15m", limit: 96, label: "15분봉" },
  "1주": { interval: "1h", limit: 168, label: "1시간봉" },
  "1개월": { interval: "1d", limit: 30, label: "일봉" },
  "1년": { interval: "1d", limit: 365, label: "일봉" },
};

export function mapCandles(raw: ApiCandle[]): Candle[] {
  const sorted = raw.toSorted((a, b) => Date.parse(a.time) - Date.parse(b.time));

  return sorted.map((candle, index) => ({
    timestamp: Date.parse(candle.time),
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
    volume: candle.volume,
    priceChangePercent: (candle.close / (sorted[index - 1]?.close ?? candle.open) - 1) * 100,
  }));
}

async function findCoinMarket(symbol: string, signal: AbortSignal) {
  let page = 0;
  let received = 0;
  while (true) {
    const result = await getMarkets(
      { assetClass: "COIN", marketState: "", signal: "", page },
      signal
    );
    const ticker = result.items.find(item => item.symbol === symbol);
    if (ticker) return ticker;
    received += result.items.length;
    if (!result.items.length || received >= result.totalElements) return;
    page += 1;
  }
}

export async function getCoinChart(symbol: string, period: ChartPeriod, signal: AbortSignal) {
  const { interval, limit } = chartIntervals[period];
  const params = new URLSearchParams({ interval, limit: String(limit) });
  const [ticker, result] = await Promise.all([
    findCoinMarket(symbol, signal),
    apiClient<{ symbol: string; interval: string; candles: ApiCandle[] }>(
      `markets/${encodeURIComponent(symbol)}/candles?${params}`,
      { signal }
    ),
  ]);
  const candles = mapCandles(result.candles);

  if (!ticker || !candles.length) throw new Error("표시할 시세 데이터가 없어요.");

  return { ticker, candles, updatedAt: Date.now() };
}
