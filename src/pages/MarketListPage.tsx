import { MarketTable } from '../components/market/MarketTable';
import { useDashboardContext } from '../hooks/useDashboardContext';

type MarketListPageProps = { page: '관심 종목' | '신호 이력' };

export function MarketListPage({ page }: MarketListPageProps) {
    const dashboard = useDashboardContext();
    const markets =
        page === '관심 종목'
            ? dashboard.filteredStocks.filter(stock =>
                  dashboard.favoriteSymbols.includes(stock.symbol)
              )
            : dashboard.filteredStocks;
    return (
        <MarketTable
            page={page}
            filteredStocks={markets}
            searchQuery={dashboard.searchQuery}
            setSearchQuery={dashboard.setSearchQuery}
            signalFilter={dashboard.signalFilter}
            setSignalFilter={dashboard.setSignalFilter}
            favoriteSymbols={dashboard.favoriteSymbols}
            toggleFavorite={dashboard.toggleFavorite}
            setSelectedStock={dashboard.setSelectedStock}
            setToastMessage={dashboard.setToastMessage}
        />
    );
}
