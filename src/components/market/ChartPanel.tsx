import { Link } from 'react-router-dom';
import '../../styles/navigation-flow.css';
import { Icon } from '../ui/Icon';
import type { Stock, ChartPeriod } from '../../types/market';
import { formatNumber } from '../../utils/format';

import { PriceChart } from './PriceChart';
import { PERIODS } from '../../types/market';

interface ChartPanelProps {
    selectedStock: Stock;
    favoriteSymbols: string[];
    toggleFavorite: (symbol: string) => void;
    chartPeriod: ChartPeriod;
    setChartPeriod: (chartPeriod: ChartPeriod) => void;
}

export function ChartPanel({
    selectedStock,
    favoriteSymbols,
    toggleFavorite,
    chartPeriod,
    setChartPeriod,
}: ChartPanelProps) {
    return (
        <section className="panel chart-panel">
            <div className="chart-header">
                <div className="stock-heading">
                    <span className="stock-icon" style={{ background: selectedStock.color }}>
                        {selectedStock.icon}
                    </span>

                    <h2>
                        {selectedStock.name}{' '}
                        <small>
                            {selectedStock.symbol} · {selectedStock.exchange}
                        </small>
                    </h2>

                    <button
                        className={`star-button ${favoriteSymbols.includes(selectedStock.symbol) ? 'is-favorite' : ''}`}
                        aria-label="선택 종목 관심 등록"
                        aria-pressed={favoriteSymbols.includes(selectedStock.symbol)}
                        onClick={() => toggleFavorite(selectedStock.symbol)}
                    >
                        <Icon name="star" size={17} />
                    </button>
                </div>

                <div className="price-heading">
                    ₩{formatNumber(selectedStock.price)}
                    <span
                        className={selectedStock.priceChangePercent > 0 ? 'positive' : 'negative'}
                    >
                        {selectedStock.priceChangePercent > 0 ? '+' : ''}
                        {selectedStock.priceChangePercent}% <small>전일 대비</small>
                    </span>
                </div>
            </div>

            <div className="stock-actions">
                <Link
                    className="flow-primary"
                    to={`/portfolio?symbol=${selectedStock.symbol}#paper-order`}
                >
                    모의 매수
                </Link>
                <Link to={`/signals?symbol=${selectedStock.symbol}`}>신호 이력 보기</Link>
            </div>

            <PriceChart
                stock={selectedStock}
                chartPeriod={chartPeriod}
                periodControls={
                    <div className="periods" aria-label="차트 기간">
                        {PERIODS.map(periodOption => (
                            <button
                                key={periodOption}
                                className={chartPeriod === periodOption ? 'chosen' : ''}
                                aria-pressed={chartPeriod === periodOption}
                                onClick={() => setChartPeriod(periodOption)}
                            >
                                {periodOption}
                            </button>
                        ))}
                    </div>
                }
            />

            <div className="chart-stats">
                <div>
                    당일 최고가
                    <strong>₩{formatNumber(Math.round(selectedStock.price * 1.012))}</strong>
                </div>

                <div>
                    당일 최저가
                    <strong>₩{formatNumber(Math.round(selectedStock.price * 0.972))}</strong>
                </div>

                <div>
                    당일 거래대금<strong>1,284.6억</strong>
                </div>
            </div>
        </section>
    );
}
