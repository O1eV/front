import { Link } from "react-router-dom";
import type { useDashboard } from "../../hooks/useDashboard";
import { formatNumber } from "../../utils/format";

export function WatchlistPanel({ dashboard }: { dashboard: ReturnType<typeof useDashboard> }) {
  if (!dashboard.watchlistLoggedIn)
    return (
      <p className="no-results">
        <Link to={"/login"}>로그인</Link> 후 관심 종목을 모아보세요.
      </p>
    );
  if (dashboard.watchlistLoading)
    return (
      <p className="no-results" role="status">
        관심 종목을 불러오는 중…
      </p>
    );
  if (dashboard.watchlistError)
    return (
      <p className="no-results" role="alert">
        {dashboard.watchlistError} <button onClick={dashboard.reloadWatchlist}>다시 시도</button>
      </p>
    );
  return (
    <section className="watchlist-content" aria-label="내 관심 종목">
      <h2>관심 종목</h2>
      {dashboard.favoriteSymbols.length === 0 && (
        <p className="no-results">등록한 관심 종목이 없어요.</p>
      )}
      {dashboard.favoriteSymbols.map(symbol => {
        const market = dashboard.watchlistMarkets.find(item => item.symbol === symbol);
        return (
          <div className="rail-row" key={symbol}>
            <Link to={`/crypto?symbol=${encodeURIComponent(symbol)}`}>
              <span className="rail-stock-name">
                {market?.koreanName ?? symbol}
                <small>{symbol}</small>
              </span>
              <span className="rail-price">
                {market?.price != null ? `${formatNumber(market.price)}원` : "시세 조회 불가"}
                <small>
                  {market?.signal
                    ? `${{ BUY: "매수", HOLD: "관망", SELL: "매도" }[market.signal]}${market.confidence != null ? ` · 확신도 ${(market.confidence * 100).toFixed(0)}%` : ""}`
                    : "AI 신호 미제공"}
                </small>
              </span>
            </Link>
            <button
              className="star-button is-favorite"
              disabled={dashboard.isWatchlistPending(symbol)}
              aria-label={`${market?.koreanName ?? symbol} 관심 해제`}
              onClick={() => void dashboard.toggleFavorite(symbol)}
            >
              ★
            </button>
          </div>
        );
      })}
      <Link className="rail-add" to={"/"}>
        종목 찾아보기 ›
      </Link>
    </section>
  );
}
