import { apiClient } from "./apiClient";

export interface MarketSearchItem {
  symbol: string;
  koreanName: string;
  englishName: string;
  assetClass: "COIN" | "KR_STOCK" | "US_STOCK";
}

export function searchMarkets(query: string, signal: AbortSignal) {
  const params = new URLSearchParams({ q: query.trim(), limit: "10" });

  return apiClient<{ items: MarketSearchItem[] }>(`markets/search?${params}`, { signal });
}
