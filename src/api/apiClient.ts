const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

export async function apiClient<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string; signal?: AbortSignal } = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },

      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal
        ? AbortSignal.any([options.signal, AbortSignal.timeout(15_000)])
        : AbortSignal.timeout(15_000),
    });
  } catch {
    throw new Error("서버에 연결하지 못했어요. 잠시 후 다시 시도해주세요.");
  }

  const result = await response.json().catch(() => null);

  if (!response.ok)
    throw new Error(result?.message || "요청을 처리하지 못했어요. 다시 시도해주세요.");

  if (!result || !("data" in result)) throw new Error("서버 응답을 확인할 수 없어요.");

  return result.data as T;
}
