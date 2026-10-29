import { lazy, Suspense, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { demoStocks } from '../api/demoStocks';
import { useAuthSession } from '../lib/auth';
import { useDemoStock } from '../hooks/useDemoStock';
import { useDashboardContext } from '../hooks/useDashboardContext';
import { formatNumber } from '../utils/format';

const LiveCandleChart = lazy(() =>
    import('../components/market/LiveCandleChart').then(module => ({
        default: module.LiveCandleChart,
    }))
);

export function StockPage({ embedded = false }: { embedded?: boolean }) {
    const session = useAuthSession();
    const [params] = useSearchParams();
    const [marketSymbol, setMarketSymbol] = useState(demoStocks[0].symbol);
    const code = (embedded ? marketSymbol : params.get('symbol')) ?? demoStocks[0].symbol;
    const stock =
        demoStocks.find(item => item.symbol === code) ??
        (/^\d{6}$/.test(code) ? { symbol: code, koreanName: `국내 주식 ${code}` } : undefined);
    return (
        <section
            className={`panel chart-panel crypto-panel stock-panel${embedded ? ' stock-panel-embedded' : ''}`}
        >
            <div className="section-heading">
                <div>
                    {embedded ? <h2>국내 주식 시세</h2> : <h1>국내 주식 시세</h1>}
                    <p>키움 데모 · 1분봉 · 10초마다 갱신</p>
                </div>
            </div>
            <div className="periods" aria-label="주식 선택">
                {demoStocks.map(item =>
                    embedded ? (
                        <button
                            type="button"
                            key={item.symbol}
                            aria-pressed={item.symbol === code}
                            onClick={() => setMarketSymbol(item.symbol)}
                        >
                            {item.koreanName}
                        </button>
                    ) : (
                        <Link
                            key={item.symbol}
                            to={`/stocks?symbol=${item.symbol}`}
                            aria-current={item.symbol === code ? 'page' : undefined}
                        >
                            {item.koreanName}
                        </Link>
                    )
                )}
            </div>
            {!stock ? (
                <p role="alert">지원하지 않는 데모 종목이에요. 6자리 종목코드를 확인해주세요.</p>
            ) : !session ? (
                <p className="no-results">
                    <Link to="/login">로그인</Link> 후 국내 주식 데모 시세와 차트를 볼 수 있어요.
                </p>
            ) : (
                <StockWorkspace
                    key={`${session.user.userId}:${session.accessToken}:${code}`}
                    code={code}
                    name={stock.koreanName}
                    token={session.accessToken}
                />
            )}
        </section>
    );
}

function StockWorkspace({ code, name, token }: { code: string; name: string; token: string }) {
    const { price, candles, reload } = useDemoStock(code, token);
    const now = price.data;
    const dashboard = useDashboardContext();
    const favorite = dashboard.favoriteSymbols.includes(code);
    return (
        <>
            <div className="chart-header">
                <div className="stock-heading">
                    <h2>{name}</h2>
                    <button
                        type="button"
                        className={`star-button ${favorite ? 'is-favorite' : ''}`}
                        aria-label={`${name} 관심 ${favorite ? '해제' : '등록'}`}
                        aria-pressed={favorite}
                        disabled={dashboard.watchlistLoading || dashboard.isWatchlistPending(code)}
                        onClick={() => void dashboard.toggleFavorite(code)}
                    >
                        ★
                    </button>
                    <small className="crypto-symbol">{code} · 키움 데모</small>
                </div>
                <div className="price-heading">
                    {now ? `₩${formatNumber(now.price)}` : '현재가 —'}
                    {now?.changeRate != null && (
                        <span
                            className={
                                now.changeRate > 0
                                    ? 'positive'
                                    : now.changeRate < 0
                                      ? 'negative'
                                      : ''
                            }
                        >
                            {now.changeRate > 0 ? '+' : ''}
                            {(now.changeRate * 100).toFixed(2)}% <small>전일 대비</small>
                        </span>
                    )}
                </div>
            </div>
            {!now && !price.error && <p role="status">현재가를 불러오는 중…</p>}
            {price.error && <p role="status">{price.error}</p>}
            {now && (
                <p className="crypto-source">
                    {now.stale || price.error
                        ? '이전 수신 가격 · 최신 시세가 아닐 수 있어요.'
                        : '최근 수신 가격'}{' '}
                    · 체결 시각{' '}
                    {new Date(now.tradeTimestamp).toLocaleString('ko-KR', {
                        timeZone: 'Asia/Seoul',
                    })}
                </p>
            )}
            {candles.error && <p role="alert">{candles.error}</p>}
            <div className="chart-ai-layout">
                <div className="chart-ai-chart">
                    {candles.data?.length ? (
                        <Suspense fallback={<p role="status">차트를 준비하는 중…</p>}>
                            <LiveCandleChart candles={candles.data} interval="1m" />
                        </Suspense>
                    ) : (
                        <p className="no-results" role="status">
                            {candles.data
                                ? '저장된 1분봉이 없어요. 장 마감 또는 수집 전에는 데이터가 없을 수 있어요.'
                                : candles.error
                                  ? '차트를 불러오지 못했어요.'
                                  : '1분봉을 불러오는 중…'}
                        </p>
                    )}
                </div>
                <aside className="panel chart-ai-panel" aria-label="국내 주식 AI 판단">
                    <span className="chart-ai-eyebrow">AI INSIGHT</span>
                    <h2>AI 판단</h2>
                    <span className="chart-ai-status">분석 준비 중</span>
                    <p>
                        국내 주식 AI 분석은 아직 제공되지 않아요. 분석이 연결되면 매수·관망·매도
                        확률과 확신도를 보여드릴게요.
                    </p>
                    <dl className="chart-ai-placeholder">
                        <div>
                            <dt>매수</dt>
                            <dd>—</dd>
                        </div>
                        <div>
                            <dt>관망</dt>
                            <dd>—</dd>
                        </div>
                        <div>
                            <dt>매도</dt>
                            <dd>—</dd>
                        </div>
                        <div>
                            <dt>확신도</dt>
                            <dd>—</dd>
                        </div>
                    </dl>
                </aside>
            </div>
            {candles.updatedAt && (
                <p className="crypto-source">
                    1분봉 마지막 조회 {new Date(candles.updatedAt).toLocaleTimeString('ko-KR')}
                    {candles.error ? ' · 갱신 실패, 이전 조회 데이터' : ''}
                </p>
            )}
            {(price.error || candles.error) && (
                <button type="button" className="max-button" onClick={reload}>
                    다시 조회
                </button>
            )}
            <p className="demo-notice">
                국내 정규장 09:00~15:30 KST 수집 데이터입니다. 수집기 연결 전 구간은 비어 있을 수
                있어요.
            </p>
        </>
    );
}
