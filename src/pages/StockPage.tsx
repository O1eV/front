import { lazy, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { demoStocks } from '../api/demoStocks';
import { useAuthSession } from '../lib/auth';
import { useDemoStock } from '../hooks/useDemoStock';
import { formatNumber } from '../utils/format';

const LiveCandleChart = lazy(() =>
    import('../components/market/LiveCandleChart').then(module => ({
        default: module.LiveCandleChart,
    }))
);

export function StockPage() {
    const session = useAuthSession();
    const [params] = useSearchParams();
    const code = params.get('symbol') ?? demoStocks[0].symbol;
    const stock = demoStocks.find(item => item.symbol === code);
    return (
        <section className="panel chart-panel crypto-panel">
            <div className="section-heading">
                <div>
                    <h1>국내 주식 시세</h1>
                    <p>키움 데모 · 1분봉 · 10초마다 갱신</p>
                </div>
            </div>
            <div className="periods" aria-label="주식 선택">
                {demoStocks.map(item => (
                    <Link
                        key={item.symbol}
                        to={`/stocks?symbol=${item.symbol}`}
                        aria-current={item.symbol === code ? 'page' : undefined}
                    >
                        {item.koreanName}
                    </Link>
                ))}
            </div>
            {!stock ? (
                <p role="alert">지원하지 않는 데모 종목이에요. 삼성전자를 선택해주세요.</p>
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
    return (
        <>
            <div className="chart-header">
                <div className="stock-heading">
                    <h2>{name}</h2>
                    <small className="crypto-symbol">{code} · 키움 데모</small>
                </div>
                <div className="price-heading">
                    {now ? `₩${formatNumber(now.price)}` : '현재가 —'}
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
