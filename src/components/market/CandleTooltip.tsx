import type { Candle } from "../../data/candles";
import { formatNumber } from "../../utils/format";

interface CandleTooltipProps {
  candle: Candle;
  left: number;
  top: number;
  live?: boolean;
}

const dateFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

const timeFormat = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

export function CandleTooltip({ candle, left, top, live }: CandleTooltipProps) {
  const date = new Date(candle.timestamp);

  return (
    <div role="tooltip" className="candle-tooltip" style={{ left, top }}>
      <strong>
        {dateFormat.format(date)}
        <small>{timeFormat.format(date)}</small>
      </strong>

      <dl>
        {[
          { label: "시작", value: `${formatNumber(candle.open)}원` },
          { label: "마지막", value: `${formatNumber(candle.close)}원` },
          { label: "최고", value: `${formatNumber(candle.high)}원` },
          { label: "최저", value: `${formatNumber(candle.low)}원` },
          { label: "거래량", value: `${formatNumber(candle.volume)}${live ? "개" : "주"}` },
        ].map(item => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}

        <div>
          <dt>등락률</dt>

          <dd
            className={
              candle.priceChangePercent > 0
                ? "positive"
                : candle.priceChangePercent < 0
                  ? "negative"
                  : ""
            }
          >
            {candle.priceChangePercent > 0 ? "+" : ""}
            {candle.priceChangePercent.toFixed(2)}%
          </dd>
        </div>
      </dl>

      <span className="tooltip-footnote">
        {live ? "업비트 시세" : "샘플 데이터"} · 등락률은 직전 종가 대비
      </span>
    </div>
  );
}
