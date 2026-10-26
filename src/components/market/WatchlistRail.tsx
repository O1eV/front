import { Link } from "react-router-dom";
import { sampleStocks } from "../../data/markets";
import type { Stock } from "../../types/market";
import { formatNumber } from "../../utils/format";
import { Icon } from "../ui/Icon";

interface WatchlistRailProps {
  favoriteSymbols: string[];
  setSelectedStock: (stock: Stock) => void;
  toggleFavorite: (symbol: string) => void;
}

export function WatchlistRail({
  favoriteSymbols,
  setSelectedStock,
  toggleFavorite,
}: WatchlistRailProps) {
  const markets = sampleStocks.filter(stock => favoriteSymbols.includes(stock.symbol));

  return (
    <aside className="watchlist-rail" aria-label="관심 종목 패널">
      <div className="rail-heading">
        <strong>관심 종목</strong>
        <span>원</span>
      </div>

      <Link className="rail-ai-link" to={"/"}>
        ✦ O1eV AI <span>종목별 판단 확인하기 ›</span>
      </Link>

      <div className="rail-list-title">
        <strong>내가 관심 있는 종목</strong>
        <p>자주 보는 종목을 모아보세요</p>
      </div>

      <div className="rail-list">
        {markets.map(stock => (
          <div className="rail-row" key={stock.symbol}>
            <Link to={`/?symbol=${stock.symbol}`} onClick={() => setSelectedStock(stock)}>
              <span className="stock-icon" style={{ background: stock.color }}>
                {stock.icon}
              </span>

              <span className="rail-stock-name">
                {stock.name}
                <small>{stock.symbol}</small>
              </span>

              <span className="rail-price">
                {formatNumber(stock.price)}원
                <small className={stock.priceChangePercent > 0 ? "positive" : "negative"}>
                  {stock.priceChangePercent > 0 ? "+" : ""}
                  {stock.priceChangePercent}%
                </small>
              </span>
            </Link>

            <button
              className="star-button is-favorite"
              aria-label={`${stock.name} 관심 해제`}
              onClick={() => toggleFavorite(stock.symbol)}
            >
              <Icon name="star" size={17} />
            </button>
          </div>
        ))}
      </div>

      {!markets.length && <p className="rail-empty">별을 눌러 관심 종목을 추가해보세요.</p>}

      <Link className="rail-add" to={"/"}>
        <span>＋</span> 종목 찾아보기
      </Link>

      <Link className="rail-all" to={"/watchlist"}>
        관심 종목 전체 보기 ›
      </Link>
    </aside>
  );
}
