import { loginUser, logoutUser, refreshTokens, type LoginResponse } from "../api/auth";
import { apiClient, ApiError, setRefreshHandler } from "../api/apiClient";
import { useSyncExternalStore } from "react";

type Session = LoginResponse & { expiresAt: number };

// Remove credentials left by earlier versions; tokens are never read from browser storage.
try {
  sessionStorage.removeItem("oev.auth");
} catch {
  // Storage may be unavailable in private browsing.
}

let session: Session | null = null;
let initialized = false;
let initializing: Promise<void> | undefined;
const listeners = new Set<() => void>();
let refreshing: Promise<string | undefined> | undefined;
let loggingOut = false;
let refreshTimer: ReturnType<typeof setTimeout> | undefined;

function saveSession(value: Session | null) {
  session = value;

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

function refreshSession(duringLogout = false): Promise<string | undefined> {
  if ((loggingOut && !duringLogout) || !session) return Promise.resolve(undefined);
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

export function initializeAuth(): Promise<void> {
  if (initializing) return initializing;

  initializing = (async () => {
    try {
      const tokens = await refreshTokens();
      const { user } = await apiClient<{ user: LoginResponse["user"] }>("users/me", {
        token: tokens.accessToken,
        skipRefresh: true,
      });

      saveSession({ ...tokens, user, expiresAt: Date.now() + tokens.expiresIn * 1000 });
    } catch {
      // No valid cookie or a failed connection leaves the app signed out.
    } finally {
      initialized = true;
      listeners.forEach(listener => listener());
    }
  })();

  return initializing;
}

export function useAuthReady() {
  return useSyncExternalStore(
    listener => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => initialized
  );
}

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

export function logout() {
  return endSession(logoutUser);
}

export function withdraw(password: string) {
  return endSession(token =>
    apiClient<null>("users/me", {
      method: "DELETE",
      body: { password },
      token,
      skipRefresh: true,
    })
  );
}

async function endSession(action: (token: string) => Promise<unknown>) {
  if (!session || loggingOut) return;

  loggingOut = true;
  clearTimeout(refreshTimer);

  try {
    // Finish cookie rotation before revoking the session to avoid restoring a logged-out cookie.
    await refreshing;
    const previous = session;
    if (!previous) return;

    let endingSession = previous;

    try {
      await action(previous.accessToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401 || error.code !== "TOKEN_EXPIRED")
        throw error;

      const token = await refreshSession(true);
      if (!token) throw error;

      if (!session || session.accessToken !== token) throw error;
      endingSession = session;
      await action(token);
    }

    if (session === endingSession) saveSession(null);
  } finally {
    loggingOut = false;
    scheduleRefresh();
  }
}

export function refreshAccessToken() {
  return refreshSession();
}
