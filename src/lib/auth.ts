import { loginUser, logoutUser, refreshTokens, type LoginResponse } from "../api/auth";
import { ApiError, setRefreshHandler } from "../api/apiClient";
import { useSyncExternalStore } from "react";

type Session = LoginResponse & { expiresAt: number };

const storageKey = "oev.auth";

function readSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || "null");

    return value?.accessToken && value?.user?.nickname && Number.isFinite(value?.expiresAt)
      ? {
          accessToken: value.accessToken,
          expiresIn: value.expiresIn,
          user: value.user,
          expiresAt: value.expiresAt,
        }
      : null;
  } catch {
    return null;
  }
}

let session = readSession();
const listeners = new Set<() => void>();
let refreshing: Promise<string | undefined> | undefined;
let loggingOut = false;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;

function saveSession(value: Session | null) {
  session = value;

  try {
    if (value) sessionStorage.setItem(storageKey, JSON.stringify(value));
    else sessionStorage.removeItem(storageKey);
  } catch {
    /* Keep the current session in memory when browser storage is unavailable. */
  }

  listeners.forEach(listener => listener());

  scheduleRefresh();
}

function scheduleRefresh() {
  clearTimeout(refreshTimer);

  if (!session || loggingOut) return;

  refreshTimer = setTimeout(
    () => {
      void refreshSession();
    },
    Math.max(0, session.expiresAt - Date.now() - 60_000)
  );
}

function refreshSession(): Promise<string | undefined> {
  if (loggingOut || !session) return Promise.resolve(undefined);
  if (refreshing) return refreshing;

  const previous = session;

  refreshing = (async () => {
    try {
      const tokens = await refreshTokens();

      if (session !== previous) return undefined;

      saveSession({ ...previous, ...tokens, expiresAt: Date.now() + tokens.expiresIn * 1000 });
      return tokens.accessToken;
    } catch (error) {
      if (session === previous) {
        if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
          saveSession(null);
        } else {
          clearTimeout(refreshTimer);
          refreshTimer = setTimeout(() => {
            void refreshSession();
          }, 30_000);
        }
      }
      return undefined;
    } finally {
      refreshing = undefined;
    }
  })();

  return refreshing;
}

setRefreshHandler(async rejectedToken => {
  if (!session || loggingOut) return undefined;
  if (session.accessToken !== rejectedToken) return session.accessToken;

  return refreshSession();
});

scheduleRefresh();

export function useAuthSession() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    () => session
  );
}

export async function login(email: string, password: string, rememberMe = false) {
  const result = await loginUser(email, password, rememberMe);

  saveSession({ ...result, expiresAt: Date.now() + result.expiresIn * 1000 });
}

export async function logout() {
  if (!session || loggingOut) return;

  loggingOut = true;
  clearTimeout(refreshTimer);

  try {
    // Finish cookie rotation before revoking the session to avoid restoring a logged-out cookie.
    await refreshing;
    const previous = session;
    if (!previous) return;

    await logoutUser(previous.accessToken);
    if (session === previous) saveSession(null);
  } finally {
    loggingOut = false;
    scheduleRefresh();
  }
}
