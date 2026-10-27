import assert from "node:assert/strict";
import fs from "node:fs";
import ts from "typescript";

const compile = source => ts.transpile(source, {
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
});
const url = source => `data:text/javascript;base64,${Buffer.from(compile(source)).toString("base64")}`;
const clientUrl = url(fs.readFileSync("src/api/apiClient.ts", "utf8").replace("import.meta.env.VITE_API_BASE_URL", "undefined"));
const apiUrl = url(fs.readFileSync("src/api/auth.ts", "utf8").replace(/['"]\.\/apiClient['"]/, JSON.stringify(clientUrl)));
const reactUrl = url("export const useSyncExternalStore = (_, get) => get();");
const authUrl = url(fs.readFileSync("src/lib/auth.ts", "utf8")
  .replace(/['"]\.\.\/api\/auth['"]/, JSON.stringify(apiUrl))
  .replace(/['"]\.\.\/api\/apiClient['"]/, JSON.stringify(clientUrl))
  .replace(/['"]react['"]/, JSON.stringify(reactUrl)));

const storage = new Map();
globalThis.sessionStorage = {
  getItem: key => storage.get(key),
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
};
const realTimeout = globalThis.setTimeout;
globalThis.setTimeout = (...args) => realTimeout(...args).unref();

const { apiClient } = await import(clientUrl);
const { registerUser, loginUser } = await import(apiUrl);
const { login, logout, useAuthSession } = await import(authUrl);
const ok = data => new Response(JSON.stringify({ data }));
const unauthorized = () => new Response(JSON.stringify({ message: "인증 만료", error: "TOKEN_EXPIRED" }), { status: 401 });
let refreshCount = 0;
let release;
let refreshGate;
let rejectRefresh = false;
const events = [];

globalThis.fetch = async (path, options) => {
  assert.equal(options.credentials, "include");
  if (path.endsWith("/login")) return ok({ accessToken: "old", expiresIn: 1800, user: { nickname: "test" } });
  if (path.endsWith("/refresh")) {
    refreshCount++;
    assert.equal(options.body, undefined);
    events.push("refresh-start");
    if (refreshGate) await refreshGate;
    events.push("refresh-end");
    return rejectRefresh ? unauthorized() : ok({ accessToken: "new", expiresIn: 1800 });
  }
  if (path.endsWith("/logout")) {
    events.push("logout");
    assert.equal(options.body, undefined);
    assert.equal(options.headers.Authorization, "Bearer new");
    return ok(null);
  }
  return options.headers.Authorization === "Bearer new" ? ok({ value: "success" }) : unauthorized();
};

const originalFetch = globalThis.fetch;
const registration = {
  email: "test@example.com", password: "Test1234", passwordConfirm: "Test1234",
  nickname: "테스트", termsAgreed: true, privacyAgreed: true, investmentNoticeAgreed: true,
};
globalThis.fetch = async (path, options) => {
  assert.equal(options.credentials, "include");
  const body = JSON.parse(options.body);
  if (path.endsWith("/register")) assert.deepEqual(body, registration);
  else assert.equal(body.rememberMe, true);
  return ok({ user: { nickname: "test" }, accessToken: "old", expiresIn: 1800 });
};
await registerUser(registration);
await loginUser("test@example.com", "test", true);
globalThis.fetch = originalFetch;

await login("test@example.com", "test");
refreshGate = new Promise(resolve => { release = resolve; });
const first = apiClient("users/me", { token: "old" });
const second = apiClient("users/me", { token: "old" });
await new Promise(resolve => setImmediate(resolve));
release();
assert.deepEqual(await Promise.all([first, second]), [{ value: "success" }, { value: "success" }]);
assert.equal(refreshCount, 1, "동시 401은 한 번만 재발급해야 함");
assert.equal(useAuthSession().accessToken, "new");
assert.equal(storage.has("oev.auth"), false);

// A failed replay must not recurse into refresh again.
const savedFetch = globalThis.fetch;
globalThis.fetch = async (path, options) => path.endsWith("/refresh") ? savedFetch(path, options) : unauthorized();
await assert.rejects(apiClient("users/me", { token: "new" }), /인증 만료/);
assert.equal(refreshCount, 2);
globalThis.fetch = savedFetch;

await login("test@example.com", "test");
refreshGate = new Promise(resolve => { release = resolve; });
const pending = apiClient("users/me", { token: "old" }).catch(() => null);
await new Promise(resolve => setImmediate(resolve));
const ending = logout();
release();
await Promise.all([pending, ending]);
assert.equal(useAuthSession(), null);
assert.deepEqual(events.slice(-3), ["refresh-start", "refresh-end", "logout"]);

await login("test@example.com", "test");
refreshGate = undefined;
rejectRefresh = true;
await assert.rejects(apiClient("users/me", { token: "old" }), /인증 만료/);
assert.equal(useAuthSession(), null, "재발급 인증 실패 시 세션 삭제");
console.log("PASS: 쿠키 요청·동시 재발급 병합·1회 재시도·로그아웃 경합·만료 세션 삭제");

// Expired access tokens must be rotated once before retrying logout.
rejectRefresh = false;
await login("test@example.com", "test");
let logoutAttempts = 0;
const logoutFetch = globalThis.fetch;
globalThis.fetch = async (path, options) => {
  if (path.endsWith("/logout")) {
    logoutAttempts++;
    assert.equal(options.method, "POST");
    assert.equal(options.body, undefined);
    assert.equal(options.credentials, "include");
    return options.headers.Authorization === "Bearer old" ? unauthorized() : ok(null);
  }
  return logoutFetch(path, options);
};
await logout();
assert.equal(logoutAttempts, 2);
assert.equal(useAuthSession(), null);
assert.equal(storage.has("oev.auth"), false);

// A server failure keeps the session so that logout can be retried.
await login("test@example.com", "test");
globalThis.fetch = async () => new Response(JSON.stringify({ message: "서버 오류" }), { status: 500 });
await assert.rejects(logout(), /서버 오류/);
assert.equal(useAuthSession().accessToken, "old");
console.log("PASS: 로그아웃 만료 토큰 재시도·저장 세션 삭제·서버 실패 시 세션 유지");

// Only TOKEN_EXPIRED triggers refresh; other 401 responses remain errors.
let unexpectedRefresh = 0;
globalThis.fetch = async path => {
  if (path.endsWith('/refresh')) unexpectedRefresh++;
  return new Response(JSON.stringify({ message: '인증 불가', error: 'UNAUTHORIZED' }), { status: 401 });
};
await assert.rejects(apiClient('users/me', { token: 'old' }), /인증 불가/);
assert.equal(unexpectedRefresh, 0);

// Startup restoration is deduplicated and uses the cookie, then fetches the profile.
const { initializeAuth } = await import(authUrl);
let restoreCount = 0;
globalThis.fetch = async (path, options) => {
  assert.equal(options.credentials, 'include');
  if (path.endsWith('/refresh')) {
    restoreCount++;
    assert.equal(options.body, undefined);
    return ok({ accessToken: 'restored', expiresIn: 1800 });
  }
  assert.equal(path, '/api/users/me');
  assert.equal(options.headers.Authorization, 'Bearer restored');
  return ok({ user: { userId: 'restored-user', nickname: '복원된 사용자' } });
};
const restoring = initializeAuth();
assert.equal(initializeAuth(), restoring);
await restoring;
assert.equal(restoreCount, 1);
assert.equal(useAuthSession().accessToken, 'restored');
assert.equal(useAuthSession().user.nickname, '복원된 사용자');
assert.equal(storage.size, 0);
console.log('PASS: TOKEN_EXPIRED 한정 재발급·초기 복원 중복 방지·프로필 복원·메모리 전용 보관');
