import { useMemo, useState } from 'react';
import type { KeyboardEvent, PointerEvent, ReactNode } from 'react';
import type { Stock, ChartPeriod } from '../../types/market';
import { createSampleCandles, priceToY } from '../../data/candles';
import { formatNumber } from '../../utils/format';
import { CandleTooltip } from './CandleTooltip';

type ChartMode = 'candles' | 'line';
type HoveredCandle = { index: number; left: number; top: number };
const TOOLTIP_WIDTH = 220;
const TOOLTIP_HEIGHT = 262;
const CHART_WIDTH = 720;
const CANDLE_SPACING = 8.6;
const FIRST_CANDLE_X = 12;
const TOOLTIP_GAP = 14;
const DEFAULT_CANDLE_INDEX = 39;
const TIME_LABEL_INDICES = [0, 16, 32, 48, 64, 79];

const getCandleX = (index: number) => index * CANDLE_SPACING + FIRST_CANDLE_X;

interface PriceChartProps {
    chartPeriod: ChartPeriod;
    stock: Stock;
    periodControls?: ReactNode;
}

export function PriceChart({ chartPeriod, stock, periodControls }: PriceChartProps) {
    const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle | null>(null);
    const [chartMode, setChartMode] = useState<ChartMode>('candles');

    const candles = useMemo(() => createSampleCandles(stock, chartPeriod), [stock, chartPeriod]);

    const getPriceY = (price: number) => priceToY(price, stock.price);
    const maximumVolume = Math.max(...candles.map(candle => candle.volume));
    const linePoints = candles
        .map((candle, index) => `${getCandleX(index)},${getPriceY(candle.close)}`)
        .join(' ');

    function selectCandle(index: number, bounds: DOMRect) {
        const selectedIndex = Math.max(0, Math.min(candles.length - 1, index));
        const x = (getCandleX(selectedIndex) / CHART_WIDTH) * bounds.width;
        const preferredLeft =
            x + TOOLTIP_GAP + TOOLTIP_WIDTH <= bounds.width
                ? x + TOOLTIP_GAP
                : x - TOOLTIP_WIDTH - TOOLTIP_GAP;

        setHoveredCandle({
            index: selectedIndex,
            left: Math.max(0, Math.min(preferredLeft, bounds.width - TOOLTIP_WIDTH)),
            top: Math.max(4, Math.min(12, bounds.height - TOOLTIP_HEIGHT)),
        });
    }

    function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
        const bounds = event.currentTarget.getBoundingClientRect();
        const svgX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
        selectCandle(Math.round((svgX - FIRST_CANDLE_X) / CANDLE_SPACING), bounds);
    }

    function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
        if (event.key === 'Escape') {
            setHoveredCandle(null);
            return;
        }

        if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
        event.preventDefault();
        selectCandle(
            (hoveredCandle?.index ?? DEFAULT_CANDLE_INDEX) + (event.key === 'ArrowRight' ? 1 : -1),
            event.currentTarget.getBoundingClientRect()
        );
    }

    return (
        <div className="chart-wrap">
            <div className="chart-toolbar">
                {periodControls}
                <div className="chart-mode" aria-label="차트 종류">
                    <button
                        aria-pressed={chartMode === 'candles'}
                        onClick={() => setChartMode('candles')}
                    >
                        캔들
                    </button>
                    <button
                        aria-pressed={chartMode === 'line'}
                        onClick={() => setChartMode('line')}
                    >
                        라인
                    </button>
                </div>
            </div>
            <div className="chart-y">
                {[1.02, 1.01, 1, 0.99, 0.98].map(ratio => (
                    <span key={ratio}>{formatNumber(Math.round(stock.price * ratio))}</span>
                ))}
            </div>
            <div className="chart-plot" onPointerLeave={() => setHoveredCandle(null)}>
                <svg
                    role="img"
                    tabIndex={0}
                    aria-label={`${stock.name} ${chartPeriod} 샘플 ${chartMode === 'candles' ? '캔들' : '라인'} 차트. 방향키로 가격 확인`}
                    viewBox="0 0 720 280"
                    preserveAspectRatio="none"
                    onPointerMove={handlePointerMove}
                    onPointerDown={handlePointerMove}
                    onKeyDown={handleKeyDown}
                    onFocus={event =>
                        selectCandle(
                            DEFAULT_CANDLE_INDEX,
                            event.currentTarget.getBoundingClientRect()
                        )
                    }
                    onBlur={() => setHoveredCandle(null)}
                >
                    {[30, 75, 120, 165, 210].map(y => (
                        <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="var(--hairline-soft)" />
                    ))}
                    {candles.map((candle, index) => {
                        const color =
                            candle.close >= candle.open ? 'var(--positive)' : 'var(--negative)';
                        const x = getCandleX(index);
                        const openY = getPriceY(candle.open),
                            closeY = getPriceY(candle.close);
                        const volumeHeight = (candle.volume / maximumVolume) * 34;
                        return (
                            <g key={index}>
                                <rect
                                    x={x - 2.5}
                                    y={265 - volumeHeight}
                                    width="5"
                                    height={volumeHeight}
                                    fill={color}
                                    opacity=".3"
                                />
                                {chartMode === 'candles' && (
                                    <>
                                        <line
                                            x1={x}
                                            x2={x}
                                            y1={getPriceY(candle.high)}
                                            y2={getPriceY(candle.low)}
                                            stroke={color}
                                        />
                                        <rect
                                            x={x - 2.5}
                                            y={Math.min(openY, closeY)}
                                            width="5"
                                            height={Math.max(1.5, Math.abs(openY - closeY))}
                                            fill={color}
                                        />
                                    </>
                                )}
                            </g>
                        );
                    })}
                    {chartMode === 'line' && (
                        <polyline
                            points={linePoints}
                            fill="none"
                            stroke="var(--primary)"
                            strokeWidth="2"
                        />
                    )}
                    {hoveredCandle && (
                        <>
                            <line
                                x1={getCandleX(hoveredCandle.index)}
                                x2={getCandleX(hoveredCandle.index)}
                                y1="0"
                                y2="265"
                                stroke="var(--text-faint)"
                                strokeDasharray="4 4"
                            />
                            <circle
                                cx={getCandleX(hoveredCandle.index)}
                                cy={getPriceY(candles[hoveredCandle.index].close)}
                                r="3"
                                fill="var(--primary)"
                            />
                        </>
                    )}
                </svg>
                {hoveredCandle && (
                    <CandleTooltip
                        candle={candles[hoveredCandle.index]}
                        left={hoveredCandle.left}
                        top={hoveredCandle.top}
                    />
                )}
            </div>
            <div className="chart-x">
                {TIME_LABEL_INDICES.map(index => (
                    <span key={index}>
                        {new Intl.DateTimeFormat('ko-KR', {
                            timeZone: 'Asia/Seoul',
                            ...(chartPeriod === '1시간' || chartPeriod === '1일'
                                ? { hour: '2-digit', minute: '2-digit', hour12: false }
                                : { month: 'numeric', day: 'numeric' }),
                        }).format(new Date(candles[index].timestamp))}
                    </span>
                ))}
            </div>
        </div>
    );
}
