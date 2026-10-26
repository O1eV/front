import { useState } from "react";
import type { Stock } from "../../types/market";
import { formatNumber } from "../../utils/format";
import { Icon } from "../ui/Icon";

type SortOption = "기본순" | "상승률" | "매수 확률";

interface MarketRankingProps {
  markets: Stock[];
  selectedStock: Stock;
  favoriteSymbols: string[];
  setSelectedStock: (stock: Stock) => void;
  toggleFavorite: (symbol: string) => void;
}

export function MarketRanking({
  markets,
  selectedStock,
  favoriteSymbols,
  setSelectedStock,
  toggleFavorite,
}: MarketRankingProps) {
  const [sortBy, setSortBy] = useState<SortOption>("기본순");
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const visibleStocks = markets
    .filter(stock => !showOnlyFavorites || favoriteSymbols.includes(stock.symbol))
    .toSorted((firstStock, secondStock) => {
      if (sortBy === "상승률") {
        return secondStock.priceChangePercent - firstStock.priceChangePercent;
      }

      if (sortBy === "매수 확률") {
        return secondStock.buyProbability - firstStock.buyProbability;
      }

      return 0;
    });

  return (
    <section className="market-ranking" aria-label="종목 목록">
      <div className="ranking-heading">
        <h2>종목 둘러보기</h2>
        <span>샘플 시세</span>
      </div>

      <div className="ranking-filters">
        <div>
          {(["기본순", "상승률", "매수 확률"] as const).map(option => (
            <button
              key={option}
              className={sortBy === option ? "active" : ""}
              aria-pressed={sortBy === option}
              onClick={() => setSortBy(option)}
            >
              {option}
            </button>
          ))}
        </div>

        <button
          className={showOnlyFavorites ? "active" : ""}
          aria-pressed={showOnlyFavorites}
          onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
        >
          관심만
        </button>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>종목</th>
              <th>현재가</th>
              <th>등락률</th>
              <th>매수 확률</th>
            </tr>
          </thead>

          <tbody>
            {visibleStocks.map((stock, index) => (
              <tr
                key={stock.symbol}
                className={selectedStock.symbol === stock.symbol ? "selected" : ""}
              >
                <td>
                  <div className="ranking-name">
                    <button
                      className={`star-button ${favoriteSymbols.includes(stock.symbol) ? "is-favorite" : ""}`}
                      aria-label={`${stock.name} 관심 ${favoriteSymbols.includes(stock.symbol) ? "해제" : "등록"}`}
                      onClick={() => toggleFavorite(stock.symbol)}
                    >
                      <Icon name="star" size={16} />
                    </button>

                    <span className="rank-number">{index + 1}</span>

                    <button
                      className="rank-stock"
                      onClick={() => setSelectedStock(stock)}
                      aria-pressed={selectedStock.symbol === stock.symbol}
                    >
                      <span className="stock-icon" style={{ background: stock.color }}>
                        {stock.icon}
                      </span>

                      <span>
                        <strong>{stock.name}</strong>
                        <small>{stock.symbol}</small>
                      </span>
                    </button>
                  </div>
                </td>

                <td>
                  <button className="ranking-price" onClick={() => setSelectedStock(stock)}>
                    {formatNumber(stock.price)}
                    <small>원</small>
                  </button>
                </td>

                <td className={stock.priceChangePercent > 0 ? "positive" : "negative"}>
                  {stock.priceChangePercent > 0 ? "+" : ""}
                  {stock.priceChangePercent.toFixed(2)}%
                </td>

                <td>
                  <div className="ranking-probability">
                    <span className="mini-track">
                      <i style={{ width: `${stock.buyProbability}%` }} />
                    </span>

                    <strong>{stock.buyProbability}%</strong>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visibleStocks.length === 0 && <p className="no-results">조건에 맞는 종목이 없어요.</p>}
      <p className="ranking-disclaimer">시세와 AI 확률은 화면 시연을 위한 예시예요.</p>
    </section>
  );
}
