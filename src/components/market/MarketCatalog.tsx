import { demoStocks, getDemoStockPrice } from '../../api/demoStocks';
import { useDashboardContext } from '../../hooks/useDashboardContext';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMarkets, type MarketFilters, type MarketList } from '../../api/markets';
import { useAuthSession } from '../../lib/auth';
import { formatNumber } from '../../utils/format';
import '../../styles/market-catalog.css';

const assets = { COIN: '코인', KR_STOCK: '국내 주식', US_STOCK: '미국 주식' };
const states = { UP: '상승', DOWN: '하락', SIDEWAYS: '횡보', VOLATILE: '급변동' };
const signals = { BUY: '매수', HOLD: '관망', SELL: '매도' };

export function MarketCatalog() {
    const dashboard = useDashboardContext();
    const session = useAuthSession();
    const [filters, setFilters] = useState<MarketFilters>({
        assetClass: '',
        marketState: '',
        signal: '',
        page: 0,
    });
    const [retry, setRetry] = useState(0);
    const [result, setResult] = useState<{ key: string; data?: MarketList; error?: string }>();
    const token = session?.accessToken;
    const activeSignal = token ? filters.signal : '';
    const key = JSON.stringify([
        filters.assetClass,
        filters.marketState,
        activeSignal,
        filters.page,
        token,
        retry,
    ]);

    useEffect(() => {
        const controller = new AbortController();

        (filters.assetClass === 'KR_STOCK'
            ? Promise.resolve({ items: [], page: 0, size: 20, totalElements: 0 } as MarketList)
            : getMarkets({ ...filters, signal: activeSignal }, controller.signal, token)
        )
            .then(data => {
                if (!controller.signal.aborted) setResult({ key, data });
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted)
                    setResult({
                        key,
                        error: error instanceof Error ? error.message : '종목을 불러오지 못했어요.',
                    });
            });

        return () => controller.abort();
    }, [filters, activeSignal, token, key]);

    function changeFilter(field: 'assetClass' | 'marketState' | 'signal', value: string) {
        setFilters(previous => ({ ...previous, [field]: value, page: 0 }));
    }

    const current = result?.key === key ? result : undefined;
    const data = current?.data;
    const stocks =
        filters.assetClass !== 'COIN' && !filters.marketState && !activeSignal && filters.page === 0
            ? demoStocks
            : [];
    const totalPages = data ? Math.ceil(data.totalElements / data.size) : 0;

    return (
        <section className="market-ranking" aria-label="종목 목록">
            <div className="ranking-heading">
                <h2>종목 둘러보기</h2>
                <span>{data ? `${data.totalElements + stocks.length}개 종목` : '종목 목록'}</span>
            </div>

            <div className="catalog-filters">
                {(
                    [
                        ['assetClass', '자산군', { COIN: assets.COIN, KR_STOCK: assets.KR_STOCK }],
                        ['marketState', '시장 상태', states],
                        ['signal', '신호 유형', signals],
                    ] as const
                ).map(([field, label, options]) => (
                    <label key={field}>
                        {label}
                        <select
                            value={field === 'signal' ? activeSignal : filters[field]}
                            disabled={field === 'signal' && !token}
                            onChange={event => changeFilter(field, event.target.value)}
                        >
                            <option value="">전체</option>
                            {Object.entries(options).map(([value, name]) => (
                                <option key={value} value={value}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>
                ))}
            </div>

            {!token && (
                <p className="catalog-note">
                    신호 유형 필터는 <Link to={'/login'}>로그인</Link> 후 이용할 수 있어요.
                </p>
            )}
            {!current && (
                <p className="no-results" role="status">
                    종목을 불러오는 중…
                </p>
            )}
            {current?.error && (
                <p className="no-results" role="alert">
                    {current.error}{' '}
                    <button type="button" onClick={() => setRetry(value => value + 1)}>
                        다시 시도
                    </button>
                </p>
            )}

            {data && (
                <>
                    <div className="table-scroll">
                        <table>
                            <thead>
                                <tr>
                                    <th>관심</th>
                                    <th>종목</th>
                                    <th>현재가</th>
                                    <th>등락률</th>
                                    <th>시장 상태</th>
                                    <th>AI 신호</th>
                                    <th>확신도</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stocks.map(stock => (
                                    <DomesticStockRow
                                        key={`${session?.user.userId}:${token}:${stock.symbol}`}
                                        stock={stock}
                                        token={token}
                                        dashboard={dashboard}
                                    />
                                ))}
                                {data.items.map(market => (
                                    <tr key={market.symbol}>
                                        <td>
                                            <button
                                                className={`star-button ${dashboard.favoriteSymbols.includes(market.symbol) ? 'is-favorite' : ''}`}
                                                aria-label={`${market.koreanName} 관심 ${dashboard.favoriteSymbols.includes(market.symbol) ? '해제' : '등록'}`}
                                                aria-pressed={dashboard.favoriteSymbols.includes(
                                                    market.symbol
                                                )}
                                                disabled={
                                                    dashboard.isWatchlistPending(market.symbol) ||
                                                    dashboard.watchlistLoading
                                                }
                                                onClick={() =>
                                                    void dashboard.toggleFavorite(market.symbol)
                                                }
                                            >
                                                ★
                                            </button>
                                        </td>
                                        <td>
                                            <Link
                                                className="rank-stock"
                                                to={`${market.assetClass === 'COIN' ? '/crypto' : '/'}?symbol=${encodeURIComponent(market.symbol)}`}
                                            >
                                                <span>
                                                    <strong>{market.koreanName}</strong>
                                                    <small>
                                                        {market.symbol} ·{' '}
                                                        {assets[market.assetClass]}
                                                    </small>
                                                </span>
                                            </Link>
                                        </td>
                                        <td>
                                            {formatNumber(market.price)}
                                            {market.assetClass === 'US_STOCK' ? ' USD' : '원'}
                                        </td>
                                        <td
                                            className={
                                                market.changeRate > 0
                                                    ? 'positive'
                                                    : market.changeRate < 0
                                                      ? 'negative'
                                                      : ''
                                            }
                                        >
                                            {market.changeRate > 0 ? '+' : ''}
                                            {(market.changeRate * 100).toFixed(2)}%
                                        </td>
                                        <td>{states[market.marketState]}</td>
                                        <td>
                                            {token
                                                ? market.signal
                                                    ? signals[market.signal]
                                                    : '미제공'
                                                : '로그인 필요'}
                                        </td>
                                        <td>
                                            {token && market.confidence != null
                                                ? `${(market.confidence * 100).toFixed(1)}%`
                                                : token
                                                  ? '미제공'
                                                  : '로그인 필요'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {!data.items.length && !stocks.length && (
                        <p className="no-results" role="status">
                            조건에 맞는 종목이 없어요.
                        </p>
                    )}
                    {totalPages > 1 && (
                        <nav className="catalog-pagination" aria-label="종목 목록 페이지">
                            <button
                                disabled={filters.page === 0}
                                onClick={() =>
                                    setFilters(previous => ({
                                        ...previous,
                                        page: previous.page - 1,
                                    }))
                                }
                            >
                                이전
                            </button>
                            <span>
                                {data.page + 1} / {totalPages}
                            </span>
                            <button
                                disabled={filters.page + 1 >= totalPages}
                                onClick={() =>
                                    setFilters(previous => ({
                                        ...previous,
                                        page: previous.page + 1,
                                    }))
                                }
                            >
                                다음
                            </button>
                        </nav>
                    )}
                </>
            )}
            <p className="ranking-disclaimer">
                국내 주식 현재가는 로그인 후 조회합니다. 서버 수집 대상이 아닌 종목은 시세가 없을 수
                있어요. 국내 주식은 시장 상태·AI 신호가 미제공되어 해당 필터 적용 시 제외됩니다.
            </p>
        </section>
    );
}

function DomesticStockRow({
    stock,
    token,
    dashboard,
}: {
    stock: (typeof demoStocks)[number];
    token?: string;
    dashboard: ReturnType<typeof useDashboardContext>;
}) {
    const [quote, setQuote] = useState<{
        price?: number;
        stale?: boolean;
        error?: boolean;
        changeRate?: number | null;
    }>({});
    useEffect(() => {
        if (!token) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        async function load() {
            try {
                const price = await getDemoStockPrice(stock.symbol, token!, controller.signal);
                if (!controller.signal.aborted)
                    setQuote({
                        price: price.price,
                        stale: price.stale,
                        changeRate: price.changeRate,
                    });
            } catch {
                if (!controller.signal.aborted)
                    setQuote(previous => ({ ...previous, error: true }));
            } finally {
                if (!controller.signal.aborted) timer = setTimeout(load, 10000);
            }
        }
        void load();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [stock.symbol, token]);
    const favorite = dashboard.favoriteSymbols.includes(stock.symbol);
    return (
        <tr>
            <td>
                <button
                    type="button"
                    className={`star-button ${favorite ? 'is-favorite' : ''}`}
                    aria-label={`${stock.koreanName} 관심 ${favorite ? '해제' : '등록'}`}
                    aria-pressed={favorite}
                    disabled={
                        dashboard.watchlistLoading || dashboard.isWatchlistPending(stock.symbol)
                    }
                    onClick={() => void dashboard.toggleFavorite(stock.symbol)}
                >
                    ★
                </button>
            </td>
            <td>
                <Link className="rank-stock" to={`/stocks?symbol=${stock.symbol}`}>
                    <span>
                        <strong>{stock.koreanName}</strong>
                        <small>{stock.symbol} · 국내 주식</small>
                    </span>
                </Link>
            </td>
            <td>
                {!token
                    ? '로그인 필요'
                    : quote.price != null
                      ? `${formatNumber(quote.price)}원${quote.error || quote.stale ? ' (이전 수신)' : ''}`
                      : quote.error
                        ? '시세 수집 대기'
                        : '조회 중…'}
            </td>
            <td
                className={
                    quote.changeRate != null && quote.changeRate > 0
                        ? 'positive'
                        : quote.changeRate != null && quote.changeRate < 0
                          ? 'negative'
                          : ''
                }
            >
                {quote.changeRate == null
                    ? '—'
                    : `${quote.changeRate > 0 ? '+' : ''}${(quote.changeRate * 100).toFixed(2)}%`}
            </td>
            <td>미제공</td>
            <td>미제공</td>
            <td>—</td>
        </tr>
    );
}
