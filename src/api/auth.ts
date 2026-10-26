import { apiClient } from "./apiClient";

export type AuthUser = { userId: string; email: string; nickname: string };

export type AuthTokens = { accessToken: string; expiresIn: number };

export type LoginResponse = AuthTokens & { user: AuthUser };

export type RegisterRequest = {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  termsAgreed: boolean;
  privacyAgreed: boolean;
  investmentNoticeAgreed: boolean;
};

export function registerUser(body: RegisterRequest) {
  return apiClient<{ user: AuthUser }>("auth/register", { method: "POST", body });
}

export function loginUser(email: string, password: string, rememberMe = false) {
  return apiClient<LoginResponse>("auth/login", {
    method: "POST",
    body: { email, password, rememberMe },
  });
}

export function refreshTokens() {
  return apiClient<AuthTokens>("auth/refresh", { method: "POST", skipRefresh: true });
}

export function logoutUser(accessToken: string) {
  return apiClient<null>("auth/logout", {
    method: "POST",
    token: accessToken,
    skipRefresh: true,
  });
}
