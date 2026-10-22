import { loginUser, logoutUser, refreshTokens, type LoginResponse } from "../api/auth";
import { useSyncExternalStore } from "react";

type Session = LoginResponse & { expiresAt: number };

const storageKey = "oev.auth";

function readSession(): Session | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(storageKey) || "null");

    return value?.accessToken &&
      value?.refreshToken &&
      value?.user?.nickname &&
      Number.isFinite(value?.expiresAt)
      ? value
      : null;
  } catch {
    return null;
  }
}

let session = readSession();
const listeners = new Set<() => void>();
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

  if (!session) return;

  refreshTimer = setTimeout(
    () => {
      void refreshSession();
    },
    Math.max(0, session.expiresAt - Date.now() - 60_000)
  );
}

async function refreshSession() {
  const previous = session;

  if (!previous) return;

  try {
    const tokens = await refreshTokens(previous.refreshToken);

    if (session === previous)
      saveSession({ ...previous, ...tokens, expiresAt: Date.now() + tokens.expiresIn * 1000 });
  } catch {
    if (session === previous) saveSession(null);
  }
}

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

export async function login(email: string, password: string) {
  const result = await loginUser(email, password);

  saveSession({ ...result, expiresAt: Date.now() + result.expiresIn * 1000 });
}

export async function logout() {
  const previous = session;

  if (!previous) return;

  await logoutUser(previous.refreshToken, previous.accessToken);

  if (session === previous) saveSession(null);
}
