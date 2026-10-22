import { useState } from "react";
import { logout, useAuthSession } from "../../lib/auth";
import { Link, NavLink } from "react-router-dom";
import { GlobalSearch } from "./GlobalSearch";
import { pagePaths } from "../../routes/paths";
import type { Page, Stock } from "../../types/market";

interface SidebarProps {
  favoriteSymbols: string[];
  selectedSymbol: string;
  onSelectStock: (stock: Stock) => void;
}

const navigation: { page: Page; label: string }[] = [
  { page: "대시보드", label: "마켓" },
  { page: "관심 종목", label: "관심 종목" },
  { page: "신호 이력", label: "신호 이력" },
  { page: "모의 포트폴리오", label: "모의투자" },
];

export function Sidebar({ favoriteSymbols, selectedSymbol, onSelectStock }: SidebarProps) {
  const session = useAuthSession();
  const [logoutError, setLogoutError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);

    setLogoutError("");

    try {
      await logout();
    } catch {
      setLogoutError("로그아웃에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="sidebar">
      <Link className="brand" to="/" aria-label="OeV 홈">
        <img src="/favicon.svg?v=4" alt="" width="36" height="36" />
      </Link>

      <nav aria-label="주 메뉴">
        {navigation.map(item => (
          <NavLink
            key={item.page}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
            to={
              item.page === "모의 포트폴리오" || item.page === "신호 이력"
                ? `${pagePaths[item.page]}?symbol=${selectedSymbol}`
                : pagePaths[item.page]
            }
            end={item.page === "대시보드"}
          >
            {item.label}
            {item.page === "관심 종목" && <span className="count">{favoriteSymbols.length}</span>}
          </NavLink>
        ))}

        <NavLink className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`} to="/crypto">
          코인 시세
        </NavLink>
      </nav>

      <GlobalSearch onSelectStock={onSelectStock} />

      <div className="auth-nav">
        {session ? (
          <>
            <Link to="/me" aria-label="내 정보">
              {session.user.nickname}님
            </Link>

            <button type="button" onClick={handleLogout} disabled={loggingOut}>
              {loggingOut ? "처리 중…" : "로그아웃"}
            </button>

            {logoutError && <span role="alert">{logoutError}</span>}
          </>
        ) : (
          <>
            <Link to="/login">로그인</Link>

            <Link className="auth-nav-signup" to="/signup">
              회원가입
            </Link>
          </>
        )}
      </div>
    </header>
  );
}
