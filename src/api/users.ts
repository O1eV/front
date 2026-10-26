import { apiClient } from "./apiClient";
import type { AuthUser } from "./auth";

export interface MyInfo {
  user: AuthUser & { createdAt: string };
  stats: { watchlistCount: number; activeApiKeyCount: number };
}

export function getMyInfo(token: string, signal: AbortSignal) {
  return apiClient<MyInfo>("users/me", { token, signal });
}
