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

export async function getCoinChart(symbol: string, period: ChartPeriod, signal: AbortSignal) {
  const { interval, limit } = chartIntervals[period];
  const params = new URLSearchParams({ interval, limit: String(limit) });
  const [markets, result] = await Promise.all([
    getMarkets({ assetClass: "COIN", marketState: "", signal: "", page: 0 }, signal),
    apiClient<{ symbol: string; interval: string; candles: ApiCandle[] }>(
      `markets/${encodeURIComponent(symbol)}/candles?${params}`,
      { signal }
    ),
  ]);
  const ticker = markets.items.find(market => market.symbol === symbol);
  const candles = mapCandles(result.candles);

  if (!ticker || !candles.length) throw new Error("표시할 시세 데이터가 없어요.");

  return { ticker, candles, updatedAt: Date.now() };
}

export interface CollectedPrice {
  symbol: string;
  price: number;
  tradeTimestamp: string;
  updatedAt: string;
  stale: boolean;
}

export function getCollectedPrice(symbol: string, signal: AbortSignal) {
  return apiClient<CollectedPrice>(`markets/${encodeURIComponent(symbol)}/price`, { signal });
}
