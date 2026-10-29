import { useEffect, useState } from 'react';
import { getDemoStockPrice, demoStocks, isKrStockCode } from '../../api/demoStocks';
import { useAuthSession } from '../../lib/auth';
import { Link } from 'react-router-dom';
import type { useDashboard } from '../../hooks/useDashboard';
import { formatNumber } from '../../utils/format';

export function WatchlistPanel({ dashboard }: { dashboard: ReturnType<typeof useDashboard> }) {
    if (!dashboard.watchlistLoggedIn)
        return (
            <p className="no-results">
                <Link to={'/login'}>로그인</Link> 후 관심 종목을 모아보세요.
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
                {dashboard.watchlistError}{' '}
                <button onClick={dashboard.reloadWatchlist}>다시 시도</button>
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
                        <Link
                            to={`${isKrStockCode(symbol) ? '/stocks' : '/crypto'}?symbol=${encodeURIComponent(symbol)}`}
                        >
                            <span className="rail-stock-name">
                                {market?.koreanName ??
                                    demoStocks.find(stock => stock.symbol === symbol)?.koreanName ??
                                    symbol}
                                <small>{symbol}</small>
                            </span>
                            {isKrStockCode(symbol) ? (
                                <StockWatchPrice symbol={symbol} />
                            ) : (
                                <span className="rail-price">
                                    {market?.price != null
                                        ? `${formatNumber(market.price)}원`
                                        : '시세 조회 불가'}
                                    <small>
                                        {market?.signal
                                            ? `${{ BUY: '매수', HOLD: '관망', SELL: '매도' }[market.signal]}${market.confidence != null ? ` · 확신도 ${(market.confidence * 100).toFixed(0)}%` : ''}`
                                            : 'AI 신호 미제공'}
                                    </small>
                                </span>
                            )}
                        </Link>
                        <button
                            className="star-button is-favorite"
                            disabled={dashboard.isWatchlistPending(symbol)}
                            aria-label={`${market?.koreanName ?? demoStocks.find(stock => stock.symbol === symbol)?.koreanName ?? symbol} 관심 해제`}
                            onClick={() => void dashboard.toggleFavorite(symbol)}
                        >
                            ★
                        </button>
                    </div>
                );
            })}
            <Link className="rail-add" to={'/'}>
                종목 찾아보기 ›
            </Link>
        </section>
    );
}

function StockWatchPrice({ symbol }: { symbol: string }) {
    const session = useAuthSession();
    return session ? (
        <StockPrice
            key={`${session.user.userId}:${session.accessToken}:${symbol}`}
            symbol={symbol}
            token={session.accessToken}
        />
    ) : null;
}
function StockPrice({ symbol, token }: { symbol: string; token: string }) {
    const [result, setResult] = useState<{ price?: number; stale?: boolean; error?: boolean }>({});
    useEffect(() => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        async function load() {
            try {
                const price = await getDemoStockPrice(symbol, token, controller.signal);
                if (!controller.signal.aborted)
                    setResult({ price: price.price, stale: price.stale });
            } catch {
                if (!controller.signal.aborted)
                    setResult(previous => ({ ...previous, error: true }));
            } finally {
                if (!controller.signal.aborted) timer = setTimeout(load, 10_000);
            }
        }
        void load();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [symbol, token]);
    return (
        <span className="rail-price">
            {result.price != null ? `${formatNumber(result.price)}원` : '시세 수집 대기'}
            <small>
                {result.error || result.stale
                    ? '이전 수신 가격 · 갱신 대기'
                    : '국내 주식 · 키움 데모'}
            </small>
        </span>
    );
}
