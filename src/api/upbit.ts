import type { Candle } from "../data/candles";
import type { ChartPeriod } from "../types/market";

type Ticker = {
  market: string;
  trade_price: number;
  signed_change_rate: number;
  high_price: number;
  low_price: number;
  acc_trade_price_24h: number;
};
type UpbitCandle = {
  candle_date_time_utc: string;
  opening_price: number;
  trade_price: number;
  high_price: number;
  low_price: number;
  candle_acc_trade_volume: number;
};
export const coinMarkets = [
  { symbol: "KRW-BTC", name: "비트코인", icon: "₿", color: "#fff0dc" },
  { symbol: "KRW-ETH", name: "이더리움", icon: "Ξ", color: "#eef0ff" },
  { symbol: "KRW-XRP", name: "리플", icon: "X", color: "#edf2f7" },
];
const intervals: Record<ChartPeriod, { path: string; count: number }> = {
  "1시간": { path: "minutes/1", count: 60 },
  "1일": { path: "minutes/15", count: 96 },
  "1주": { path: "minutes/240", count: 42 },
  "1개월": { path: "days", count: 30 },
  "1년": { path: "weeks", count: 52 },
};
async function request<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/upbit/v1/${path}`, { signal });
  if (!response.ok)
    throw new Error(
      response.status === 429
        ? "조회 요청이 많아요. 잠시 후 다시 시도해주세요."
        : "업비트 시세를 불러오지 못했어요."
    );
  return response.json();
}
export async function getCoinChart(symbol: string, period: ChartPeriod, signal: AbortSignal) {
  const interval = intervals[period];
  const [tickers, raw] = await Promise.all([
    request<Ticker[]>(`ticker?markets=${encodeURIComponent(symbol)}`, signal),
    request<UpbitCandle[]>(
      `candles/${interval.path}?market=${encodeURIComponent(symbol)}&count=${interval.count}`,
      signal
    ),
  ]);
  if (!tickers.length || !raw.length) throw new Error("표시할 시세 데이터가 없어요.");
  const candles: Candle[] = raw
    .slice()
    .reverse()
    .map(c => ({
      timestamp: Date.parse(c.candle_date_time_utc + "Z"),
      open: c.opening_price,
      close: c.trade_price,
      high: c.high_price,
      low: c.low_price,
      volume: c.candle_acc_trade_volume,
      priceChangePercent: 0,
    }));
  candles.forEach((c, index) => {
    const previous = candles[index - 1]?.close ?? c.open;
    c.priceChangePercent = (c.close / previous - 1) * 100;
  });
  return { ticker: tickers[0], candles, updatedAt: Date.now() };
}
