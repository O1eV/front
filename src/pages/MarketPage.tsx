import { MarketOverview } from "../components/market/MarketOverview";
import { MarketRanking } from "../components/market/MarketRanking";
import { ChartPanel } from "../components/market/ChartPanel";
import { AiInsight } from "../components/market/AiInsight";
import { useDashboardContext } from "../hooks/useDashboardContext";

export function MarketPage() {
  const {
    selectedStock,
    setSelectedStock,
    favoriteSymbols,
    toggleFavorite,
    chartPeriod,
    setChartPeriod,
    filteredStocks,
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
        <MarketRanking
          markets={filteredStocks}
          selectedStock={selectedStock}
          favoriteSymbols={favoriteSymbols}
          setSelectedStock={setSelectedStock}
          toggleFavorite={toggleFavorite}
        />
      </div>
    </div>
  );
}
