const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/+$/, "");

type RefreshHandler = (rejectedToken: string) => Promise<string | undefined>;
let refreshHandler: RefreshHandler | undefined;

export function setRefreshHandler(handler: RefreshHandler) {
  refreshHandler = handler;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiClient<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    token?: string;
    signal?: AbortSignal;
    skipRefresh?: boolean;
  } = {}
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${apiBaseUrl}/${path.replace(/^\/+/, "")}`, {
      method: options.method ?? "GET",
      credentials: "include",
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

  if (
    response.status === 401 &&
    result?.error === "TOKEN_EXPIRED" &&
    options.token &&
    !options.skipRefresh &&
    refreshHandler
  ) {
    const token = await refreshHandler(options.token);

    if (token && !options.signal?.aborted)
      return apiClient<T>(path, { ...options, token, skipRefresh: true });
  }

  if (!response.ok)
    throw new ApiError(
      result?.message || "요청을 처리하지 못했어요. 다시 시도해주세요.",
      response.status,
      typeof result?.error === "string" ? result.error : undefined
    );

  if (!result || !("data" in result)) throw new Error("서버 응답을 확인할 수 없어요.");

  return result.data as T;
}
