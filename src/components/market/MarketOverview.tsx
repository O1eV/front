import type { Stock } from '../../types/market';
import { formatNumber } from '../../utils/format';
import { sampleStocks } from '../../data/markets';
import { Sparkline } from './Sparkline';

export function MarketOverview({
    selectedStock,
    setSelectedStock,
}: {
    selectedStock: Stock;
    setSelectedStock: (stock: Stock) => void;
}) {
    return (
        <section className="market-pulse" aria-label="시장 요약">
            {sampleStocks.slice(0, 3).map((stock, index) => (
                <button
                    className={`pulse-item ${stock.symbol === selectedStock.symbol ? 'selected' : ''}`}
                    key={stock.symbol}
                    onClick={() => setSelectedStock(stock)}
                >
                    <div className="pulse-label">
                        <span className="stock-icon" style={{ background: stock.color }}>
                            {stock.icon}
                        </span>

                        <strong>{stock.name}</strong>
                        <span className="pulse-symbol">{stock.symbol}</span>
                    </div>

                    <div className="pulse-price">
                        {formatNumber(stock.price)}

                        <small className={stock.priceChangePercent > 0 ? 'positive' : 'negative'}>
                            {stock.priceChangePercent > 0 ? '+' : ''}
                            {stock.priceChangePercent}%
                        </small>
                    </div>

                    <Sparkline seed={index} down={stock.priceChangePercent < 0} />
                </button>
            ))}
        </section>
    );
}
