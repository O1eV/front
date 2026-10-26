import { apiClient } from "./apiClient";
import type { SignalValue } from "./realtime";

export interface LatestSignal {
  signalId: number;
  symbol: string;
  previousSignal: SignalValue | null;
  signal: SignalValue;
  buyProbability: number;
  holdProbability: number;
  sellProbability: number;
  confidence: number;
  price: number | null;
  generatedAt: string;
  stale: boolean;
  modelVersion?: string | null;
}
export function validateSignal(value: LatestSignal, symbol: string) {
  const probabilities = [value.buyProbability, value.holdProbability, value.sellProbability];
  if (
    value.symbol !== symbol ||
    !["BUY", "HOLD", "SELL"].includes(value.signal) ||
    !probabilities.every(number => Number.isFinite(number) && number >= 0 && number <= 1) ||
    Math.abs(probabilities.reduce((a, b) => a + b, 0) - 1) > 0.001 ||
    !Number.isFinite(value.confidence) ||
    value.confidence < 0 ||
    value.confidence > 1 ||
    !Number.isFinite(Date.parse(value.generatedAt))
  )
    throw new Error("신호 응답을 확인할 수 없어요.");
  return value;
}
export async function getLatestSignal(symbol: string, token: string, signal: AbortSignal) {
  return validateSignal(
    await apiClient<LatestSignal>(`signals/${encodeURIComponent(symbol)}`, { token, signal }),
    symbol
  );
}
