import { Icon } from '../ui/Icon';
import { Sparkline } from './Sparkline';
import { formatNumber } from '../../utils/format';
import { Link } from 'react-router-dom';
import type { Stock } from '../../types/market';

interface MarketRowProps {
    stock: Stock;
    index: number;
    showHistory: boolean;
    favoriteSymbols: string[];
    toggleFavorite: (symbol: string) => void;
    setSelectedStock: (stock: Stock) => void;
}

export function MarketRow({
    stock,
    index,
    showHistory,
    favoriteSymbols,
    toggleFavorite,
    setSelectedStock,
}: MarketRowProps) {
    return (
        <tr>
            <td>
                <button
                    className={`star-button ${favoriteSymbols.includes(stock.symbol) ? 'is-favorite' : ''}`}
                    aria-label={`${stock.name} 관심 종목 ${favoriteSymbols.includes(stock.symbol) ? '해제' : '등록'}`}
                    onClick={() => toggleFavorite(stock.symbol)}
                >
                    <Icon name="star" size={17} />
                </button>
            </td>
            <td>
                <Link
                    to="/"
                    className="table-stock"
                    onClick={() => {
                        setSelectedStock(stock);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <span className="stock-icon" style={{ background: stock.color }}>
                        {stock.icon}
                    </span>
                    <span>
                        {stock.name}
                        <small>{stock.symbol}</small>
                    </span>
                </Link>
            </td>
            <td className="table-price">₩{formatNumber(stock.price)}</td>
            <td className={stock.priceChangePercent > 0 ? 'positive' : 'negative'}>
                {stock.priceChangePercent > 0 ? '+' : ''}
                {stock.priceChangePercent.toFixed(2)}%
            </td>
            <td>
                <Sparkline seed={index} down={stock.priceChangePercent < 0} />
            </td>
            <td>
                <span className={`signal-pill ${stock.buyProbability > 50 ? '' : 'neutral'}`}>
                    <span />
                    {stock.buyProbability > 50 ? '매수 우세' : '관망 우세'}
                </span>
            </td>
            <td>
                {showHistory ? (
                    `10:${40 - index * 7}`
                ) : (
                    <span className="table-percent">
                        {stock.buyProbability}
                        <small>%</small>
                        <span className="mini-track">
                            <i style={{ width: `${stock.buyProbability}%` }} />
                        </span>
                    </span>
                )}
            </td>
            <td>
                <Link
                    to="/"
                    className="icon-button"
                    aria-label={`${stock.name} 상세 보기`}
                    onClick={() => {
                        setSelectedStock(stock);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <Icon name="arrow" size={17} />
                </Link>
            </td>
        </tr>
    );
}
