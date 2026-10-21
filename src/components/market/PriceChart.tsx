import { useMemo, useState } from "react";
import type { KeyboardEvent, PointerEvent, ReactNode } from "react";
import type { Stock, ChartPeriod } from "../../types/market";
import { createSampleCandles, priceToY, type Candle } from "../../data/candles";
import { formatNumber } from "../../utils/format";
import { CandleTooltip } from "./CandleTooltip";

type ChartMode = "candles" | "line";
type HoveredCandle = { index: number; left: number; top: number };

const TOOLTIP_WIDTH = 220;
const TOOLTIP_HEIGHT = 262;
const CHART_WIDTH = 720;
const FIRST_CANDLE_X = 12;
const TOOLTIP_GAP = 14;
const DEFAULT_CANDLE_INDEX = 39;
const TIME_LABEL_INDICES = [0, 16, 32, 48, 64, 79];

interface PriceChartProps {
  chartPeriod: ChartPeriod;
  stock: Stock;
  periodControls?: ReactNode;
  liveCandles?: Candle[];
}

export function PriceChart({ chartPeriod, stock, periodControls, liveCandles }: PriceChartProps) {
  const [hoveredCandle, setHoveredCandle] = useState<HoveredCandle | null>(null);
  const [chartMode, setChartMode] = useState<ChartMode>("candles");

  const candles = useMemo(
    () => liveCandles ?? createSampleCandles(stock, chartPeriod),
    [stock, chartPeriod, liveCandles]
  );
  const spacing = 680 / Math.max(1, candles.length - 1);
  const getCandleX = (index: number) => index * spacing + FIRST_CANDLE_X;
  const minimum = Math.min(...candles.map(c => c.low));
  const maximum = Math.max(...candles.map(c => c.high));
  const padding = Math.max((maximum - minimum) * 0.1, maximum * 0.0001);
  const bottom = minimum - padding;
  const range = maximum - minimum + padding * 2;

  const getPriceY = (price: number) =>
    liveCandles ? 210 - ((price - bottom) / range) * 180 : priceToY(price, stock.price);
  const maximumVolume = Math.max(1, ...candles.map(candle => candle.volume));
  const linePoints = candles
    .map((candle, index) => `${getCandleX(index)},${getPriceY(candle.close)}`)
    .join(" ");

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
    selectCandle(Math.round((svgX - FIRST_CANDLE_X) / spacing), bounds);
  }

  function handleKeyDown(event: KeyboardEvent<SVGSVGElement>) {
    if (event.key === "Escape") {
      setHoveredCandle(null);
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    selectCandle(
      (hoveredCandle?.index ?? DEFAULT_CANDLE_INDEX) + (event.key === "ArrowRight" ? 1 : -1),
      event.currentTarget.getBoundingClientRect()
    );
  }

  return (
    <div className="chart-wrap">
      <div className="chart-toolbar">
        {periodControls}
        <div className="chart-mode" aria-label="차트 종류">
          <button aria-pressed={chartMode === "candles"} onClick={() => setChartMode("candles")}>
            캔들
          </button>
          <button aria-pressed={chartMode === "line"} onClick={() => setChartMode("line")}>
            라인
          </button>
        </div>
      </div>
      <div className="chart-y">
        {[1.02, 1.01, 1, 0.99, 0.98].map(ratio => (
          <span key={ratio}>
            {formatNumber(
              Math.round(
                liveCandles ? bottom + ((ratio - 0.98) / 0.04) * range : stock.price * ratio
              )
            )}
          </span>
        ))}
      </div>
      <div className="chart-plot" onPointerLeave={() => setHoveredCandle(null)}>
        <svg
          role="img"
          tabIndex={0}
          aria-label={`${stock.name} ${chartPeriod} ${liveCandles ? "업비트" : "샘플"} ${chartMode === "candles" ? "캔들" : "라인"} 차트. 방향키로 가격 확인`}
          viewBox="0 0 720 280"
          preserveAspectRatio="none"
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerMove}
          onKeyDown={handleKeyDown}
          onFocus={event =>
            selectCandle(DEFAULT_CANDLE_INDEX, event.currentTarget.getBoundingClientRect())
          }
          onBlur={() => setHoveredCandle(null)}
        >
          {[30, 75, 120, 165, 210].map(y => (
            <line key={y} x1="0" x2="720" y1={y} y2={y} stroke="var(--hairline-soft)" />
          ))}
          {candles.map((candle, index) => {
            const color = candle.close >= candle.open ? "var(--positive)" : "var(--negative)";
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
                {chartMode === "candles" && (
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
          {chartMode === "line" && (
            <polyline points={linePoints} fill="none" stroke="var(--primary)" strokeWidth="2" />
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
            live={!!liveCandles}
          />
        )}
      </div>
      <div className="chart-x">
        {TIME_LABEL_INDICES.map((_, labelIndex) => {
          const index = Math.round((labelIndex / 5) * (candles.length - 1));
          return (
            <span key={index}>
              {new Intl.DateTimeFormat("ko-KR", {
                timeZone: "Asia/Seoul",
                ...(chartPeriod === "1시간" || chartPeriod === "1일"
                  ? { hour: "2-digit", minute: "2-digit", hour12: false }
                  : { month: "numeric", day: "numeric" }),
              }).format(new Date(candles[index].timestamp))}
            </span>
          );
        })}
      </div>
    </div>
  );
}
