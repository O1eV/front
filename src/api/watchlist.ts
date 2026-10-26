import { apiClient } from "./apiClient";

export interface WatchlistItem {
  symbol: string;
  addedAt: string;
  koreanName: string;
  price: number | null;
  signal: "BUY" | "HOLD" | "SELL" | null;
  confidence: number | null;
}

export const getWatchlist = (token: string, signal?: AbortSignal) =>
  apiClient<{ items: WatchlistItem[] }>("watchlist", { token, signal });

export const addWatchlist = (symbol: string, token: string) =>
  apiClient<{ symbol: string; addedAt: string }>("watchlist", {
    method: "POST",
    body: { symbol },
    token,
  });

export const removeWatchlist = (symbol: string, token: string) =>
  apiClient<null>(`watchlist/${encodeURIComponent(symbol)}`, { method: "DELETE", token });
