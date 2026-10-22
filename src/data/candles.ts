import { PERIODS } from "../types/market";
import type { Stock, ChartPeriod } from "../types/market";

export interface Candle {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
  priceChangePercent: number;
}

const SAMPLE_END_TIME = Date.parse("2026-10-19T14:00:00+09:00");
const PERIOD_DURATION_MS: Record<ChartPeriod, number> = {
  "1시간": 60 * 60_000,
  "1일": 24 * 60 * 60_000,
  "1주": 7 * 24 * 60 * 60_000,
  "1개월": 30 * 24 * 60 * 60_000,
  "1년": 365 * 24 * 60 * 60_000,
};

export function priceToY(price: number, referencePrice: number) {
  return 120 - (price / referencePrice - 1) * 4500;
}

/** 차트와 툴팁이 함께 사용하는 고정된 샘플 데이터입니다. 실제 시세가 아닙니다. */

export function createSampleCandles(stock: Stock, chartPeriod: ChartPeriod): Candle[] {
  const seed = PERIODS.indexOf(chartPeriod) * 1.4 + stock.buyProbability;
  const getPriceFromY = (chartY: number) => Math.round(stock.price * (1 + (120 - chartY) / 4500));
  let previousClose = 0;

  return Array.from({ length: 80 }, (_, index) => {
    const openY = 190 - index * 1.4 + Math.sin(index * 0.24 + seed) * 25;
    const closeY = openY + Math.sin(index * 1.7 + seed) * 12 - 2;
    const open = getPriceFromY(openY);
    const close = getPriceFromY(closeY);
    const high = getPriceFromY(Math.min(openY, closeY) - 5 - Math.abs(Math.cos(index)) * 7);
    const low = getPriceFromY(Math.max(openY, closeY) + 5 + Math.abs(Math.sin(index)) * 6);
    const previousPrice = previousClose || open;

    previousClose = close;

    return {
      timestamp:
        SAMPLE_END_TIME -
        PERIOD_DURATION_MS[chartPeriod] +
        (index / 79) * PERIOD_DURATION_MS[chartPeriod],
      open,
      close,
      high,
      low,
      volume: Math.round(((15 + Math.abs(Math.sin(index * 2.4)) * 40) * 100_000_000) / stock.price),
      priceChangePercent: ((close - previousPrice) / previousPrice) * 100,
    };
  });
}
