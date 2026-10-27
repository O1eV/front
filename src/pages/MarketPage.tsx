import { MarketOverview } from '../components/market/MarketOverview';
import { MarketCatalog } from '../components/market/MarketCatalog';
import { ChartPanel } from '../components/market/ChartPanel';
import { AiInsight } from '../components/market/AiInsight';
import { useDashboardContext } from '../hooks/useDashboardContext';

export function MarketPage() {
    const {
        selectedStock,
        setSelectedStock,
        favoriteSymbols,
        toggleFavorite,
        chartPeriod,
        setChartPeriod,
    } = useDashboardContext();

    return (
        <div className="market-home">
            <div className="market-status">
                <span>
                    <i />
                    국내 주식
                </span>

                <span>코스피 · 코스닥</span>
            </div>

            <MarketOverview selectedStock={selectedStock} setSelectedStock={setSelectedStock} />

            <div className="market-explorer">
                <div className="stock-detail">
                    <div className="chart-ai-pair">
                        <ChartPanel
                            selectedStock={selectedStock}
                            favoriteSymbols={favoriteSymbols}
                            toggleFavorite={toggleFavorite}
                            chartPeriod={chartPeriod}
                            setChartPeriod={setChartPeriod}
                        />

                        <AiInsight selectedStock={selectedStock} featured />
                    </div>
                </div>

                <MarketCatalog />
            </div>
        </div>
    );
}
