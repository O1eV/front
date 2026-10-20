import { Icon } from '../components/ui/Icon';
import { MarketRanking } from '../components/market/MarketRanking';
import { useDashboardContext } from '../hooks/useDashboardContext';
import { formatNumber } from '../utils/format';
import '../styles/markets.css';

export function MarketBrowsePage({ favoritesOnly = false }: { favoritesOnly?: boolean }) {
    const dashboard = useDashboardContext();
    const { selectedStock } = dashboard;
    const markets = favoritesOnly
        ? dashboard.filteredStocks.filter(stock => dashboard.favoriteSymbols.includes(stock.symbol))
        : dashboard.filteredStocks;

    return (
        <div className="market-browse">
            <div className="browse-tools">
                <label className="market-search">
                    <Icon name="search" size={18} />
                    <input
                        aria-label="종목 검색"
                        placeholder="종목명 또는 코드 검색"
                        value={dashboard.searchQuery}
                        onChange={event => dashboard.setSearchQuery(event.target.value)}
                    />
                </label>
                <button
                    className="signal-filter"
                    aria-pressed={dashboard.signalFilter === '매수 신호'}
                    onClick={() =>
                        dashboard.setSignalFilter(
                            dashboard.signalFilter === '전체' ? '매수 신호' : '전체'
                        )
                    }
                >
                    매수 신호만
                </button>
            </div>
            <section className="selected-quote" aria-label="선택 종목" aria-live="polite">
                <div>
                    <strong>{selectedStock.name}</strong>
                    <small>
                        {selectedStock.symbol} · {selectedStock.exchange}
                    </small>
                </div>
                <div>
                    <strong>{formatNumber(selectedStock.price)}원</strong>
                    <small
                        className={selectedStock.priceChangePercent > 0 ? 'positive' : 'negative'}
                    >
                        {selectedStock.priceChangePercent > 0 ? '+' : ''}
                        {selectedStock.priceChangePercent}%
                    </small>
                </div>
            </section>
            <MarketRanking
                markets={markets}
                selectedStock={selectedStock}
                favoriteSymbols={dashboard.favoriteSymbols}
                setSelectedStock={dashboard.setSelectedStock}
                toggleFavorite={dashboard.toggleFavorite}
            />
        </div>
    );
}
