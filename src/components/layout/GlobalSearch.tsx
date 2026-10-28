import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sampleStocks } from '../../data/markets';
import { searchMarkets, type MarketSearchItem } from '../../api/markets';
import { Icon } from '../ui/Icon';
import '../../styles/navigation-flow.css';

function marketHref(market: MarketSearchItem) {
    const params = new URLSearchParams({ symbol: market.symbol });

    return `/crypto?${params}`;
}

export function GlobalSearch({
    onSelectStock,
}: {
    onSelectStock: (stock: (typeof sampleStocks)[number]) => void;
}) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();
    const normalized = query.trim().toLowerCase();
    const [retry, setRetry] = useState(0);
    const [search, setSearch] = useState<{
        query: string;
        items: MarketSearchItem[];
        error?: string;
    }>({ query: '', items: [] });

    useEffect(() => {
        if (!open || !normalized) return;

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                const result = await searchMarkets(normalized, controller.signal);

                if (!controller.signal.aborted)
                    setSearch({
                        query: normalized,
                        // 검색 API는 q와 limit만 지원하므로 제공 범위 밖의 자산을 클라이언트에서 제외한다.
                        items: result.items.filter(item => item.assetClass === 'COIN'),
                    });
            } catch (error) {
                if (!controller.signal.aborted)
                    setSearch({
                        query: normalized,
                        items: [],
                        error: error instanceof Error ? error.message : '검색에 실패했어요.',
                    });
            }
        }, 300);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [normalized, open, retry]);

    const loading = search.query !== normalized;
    const results = loading ? [] : search.items;
    const error = loading ? undefined : search.error;

    function selectMarket(symbol: string) {
        const stock = sampleStocks.find(item => item.symbol === symbol);
        if (stock) onSelectStock(stock);
        close();
    }

    function close() {
        setOpen(false);
        setQuery('');
        setSearch({ query: '', items: [] });
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();
        if (!normalized || !results.length) return;
        selectMarket(results[0].symbol);
        navigate(marketHref(results[0]));
    }

    return (
        <form
            className="global-search-shell"
            role="search"
            onSubmit={handleSubmit}
            onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
            }}
            onKeyDown={event => {
                if (event.key === 'Escape') setOpen(false);
            }}
        >
            <label className="global-search">
                <Icon name="search" size={18} />
                <input
                    aria-label="코인 검색"
                    placeholder="코인 이름 또는 코드 검색"
                    value={query}
                    autoComplete="off"
                    aria-controls={open && normalized ? 'global-search-results' : undefined}
                    onFocus={() => setOpen(true)}
                    onChange={event => {
                        setQuery(event.target.value);
                        setOpen(true);
                    }}
                />
            </label>

            {open && normalized && (
                <div className="global-search-results" id="global-search-results">
                    <p role="status">
                        {loading
                            ? '종목을 검색하는 중…'
                            : error
                              ? '검색 실패'
                              : `검색 결과 ${results.length}개`}
                    </p>
                    {error && (
                        <p role="alert">
                            {error}{' '}
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch({ query: '', items: [] });
                                    setRetry(value => value + 1);
                                }}
                            >
                                다시 시도
                            </button>
                        </p>
                    )}
                    {results.map(market => (
                        <Link
                            key={market.symbol}
                            to={marketHref(market)}
                            onClick={() => selectMarket(market.symbol)}
                        >
                            <span>
                                {market.koreanName}
                                <small>
                                    {market.symbol} ·{' '}
                                    {market.assetClass === 'COIN' ? '코인' : '국내 주식'}
                                </small>
                            </span>
                            <span aria-hidden="true">→</span>
                        </Link>
                    ))}
                    {!loading && !error && !results.length && (
                        <p>일치하는 종목이 없어요. 이름이나 코드를 확인해주세요.</p>
                    )}
                </div>
            )}
        </form>
    );
}
