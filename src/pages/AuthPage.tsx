import { useState, type FormEvent } from "react";
import { login } from "../lib/auth";
import { registerUser } from "../api/auth";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/auth.css";

type AuthPageProps = { mode: "login" | "signup" };

export function AuthPage({ mode }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState(
    location.state?.registered ? "회원가입이 완료됐어요. 로그인해주세요." : ""
  );

  const [passwordError, setPasswordError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) return;

    const values = new FormData(event.currentTarget);

    if (isSignup && values.get("password") !== values.get("confirmPassword")) {
      setPasswordError("비밀번호가 일치하지 않아요.");

      setMessage("");

      event.currentTarget.querySelector<HTMLInputElement>('[name="confirmPassword"]')?.focus();

      return;
    }

    setPasswordError("");

    setMessage("");

    setIsSubmitting(true);

    const email = String(values.get("email") || "").trim();
    const password = String(values.get("password") || "");

    try {
      if (isSignup) {
        await registerUser({
          email,
          password,
          passwordConfirm: String(values.get("confirmPassword") || ""),
          nickname: String(values.get("name") || "").trim(),
          termsAgreed: values.get("termsAgreed") === "on",
          privacyAgreed: values.get("privacyAgreed") === "on",
          investmentNoticeAgreed: values.get("investmentNoticeAgreed") === "on",
        });

        navigate("/login", { replace: true, state: { registered: true } });
      } else {
        await login(email, password, values.get("rememberMe") === "on");

        navigate("/", { replace: true });
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "요청에 실패했어요.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <header className="auth-header">
        <Link className="auth-brand" aria-label="OeV 홈" to={"/"}>
          <img src="/logo.png" alt="" width="36" height="36" />
          <span>OeV</span>
        </Link>

        <Link className="auth-home" aria-label="닫고 마켓으로 돌아가기" to={"/"}>
          ×
        </Link>
      </header>

      <main className="auth-main">
        <div className="auth-intro">
          <h1 id="auth-title">{isSignup ? "OeV 회원가입" : "OeV 로그인"}</h1>
          <p>{isSignup ? "나만의 투자 흐름을 만들어보세요" : "오늘의 시장, 함께 살펴볼까요?"}</p>
        </div>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-tabs" aria-label="계정 메뉴">
            <Link aria-current={!isSignup ? "page" : undefined} to={"/login"}>
              로그인
            </Link>

            <Link aria-current={isSignup ? "page" : undefined} to={"/signup"}>
              회원가입
            </Link>
          </div>

          <form
            className={`auth-form${isSignup ? " auth-form-signup" : ""}`}
            onSubmit={handleSubmit}
          >
            {isSignup && (
              <label className="auth-field">
                닉네임
                <input
                  name="name"
                  autoComplete="nickname"
                  placeholder="닉네임 2~20자"
                  minLength={2}
                  maxLength={20}
                  required
                />
              </label>
            )}

            <label className="auth-field">
              이메일
              <input
                name="email"
                type="email"
                autoComplete="email"
                maxLength={255}
                placeholder="example@email.com"
                required
              />
            </label>

            <div className="auth-field">
              <label htmlFor="auth-password">비밀번호</label>

              <div className="auth-password">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  placeholder={isSignup ? "8자 이상 입력해주세요" : "비밀번호를 입력해주세요"}
                  minLength={isSignup ? 8 : undefined}
                  maxLength={isSignup ? 64 : undefined}
                  pattern={isSignup ? "(?=.*[A-Za-z])(?=.*[0-9])[!-~]{8,64}" : undefined}
                  title={isSignup ? "영문과 숫자를 포함한 8~64자" : undefined}
                  aria-describedby={isSignup ? "password-hint" : undefined}
                  required
                />

                <button
                  type="button"
                  aria-controls="auth-password"
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword(value => !value)}
                >
                  {showPassword ? "숨기기" : "보기"}
                </button>
              </div>

              {isSignup && (
                <small id="password-hint">영문과 숫자를 포함한 8~64자로 설정해주세요.</small>
              )}
            </div>

            {isSignup && (
              <label className="auth-field">
                비밀번호 확인
                <input
                  name="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="비밀번호를 한 번 더 입력해주세요"
                  required
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? "password-error" : undefined}
                  onChange={() => {
                    setPasswordError("");

                    setMessage("");
                  }}
                />
                {passwordError && (
                  <small id="password-error" className="auth-error" role="alert">
                    {passwordError}
                  </small>
                )}
              </label>
            )}

            {isSignup && (
              <fieldset className="auth-agreements">
                <legend>필수 동의</legend>

                <label>
                  <input type="checkbox" name="termsAgreed" required />
                  서비스 이용약관 동의 (필수)
                </label>

                <label>
                  <input type="checkbox" name="privacyAgreed" required />
                  개인정보 처리방침 동의 (필수)
                </label>

                <label>
                  <input type="checkbox" name="investmentNoticeAgreed" required />
                  투자 유의사항 동의 (필수)
                </label>
              </fieldset>
            )}

            {!isSignup && (
              <label className="auth-remember">
                <input type="checkbox" name="rememberMe" />
                로그인 상태 유지
              </label>
            )}

            <button className="auth-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "처리 중…" : isSignup ? "회원가입" : "로그인"}
            </button>

            {message && (
              <p className="auth-feedback" role="status">
                {message}
              </p>
            )}
          </form>
        </section>

        <p className="auth-switch">
          {isSignup ? "이미 계정이 있으신가요?" : "아직 계정이 없으신가요?"}
          <Link to={isSignup ? "/login" : "/signup"}>{isSignup ? "로그인" : "회원가입"}</Link>
        </p>
      </main>
    </div>
  );
}
