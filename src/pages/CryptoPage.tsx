import { useEffect, useState } from "react";
import { coinMarkets, getCoinChart } from "../api/upbit";
import { PriceChart } from "../components/market/PriceChart";
import { PERIODS, type ChartPeriod, type Stock } from "../types/market";
import { formatNumber } from "../utils/format";

type ChartData = Awaited<ReturnType<typeof getCoinChart>>;
export function CryptoPage() {
  const [symbol, setSymbol] = useState("KRW-BTC");
  const [period, setPeriod] = useState<ChartPeriod>("1일");
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ key: string; data?: ChartData; error?: string }>({
    key: "",
  });
  const key = `${symbol}:${period}`;
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function load() {
      try {
        const data = await getCoinChart(
          symbol,
          period,
          AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)])
        );
        if (!controller.signal.aborted) setState({ key: `${symbol}:${period}`, data });
      } catch (error) {
        if (!controller.signal.aborted)
          setState(previous => ({
            key: `${symbol}:${period}`,
            data: previous.key === `${symbol}:${period}` ? previous.data : undefined,
            error: error instanceof Error ? error.message : "시세 연결을 확인해주세요.",
          }));
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(load, 20_000);
      }
    }
    void load();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [symbol, period, retry]);
  const data = state.key === key ? state.data : undefined;
  const coin = coinMarkets.find(coin => coin.symbol === symbol)!;
  const stock: Stock | undefined = data
    ? {
        ...coin,
        exchange: "UPBIT",
        price: data.ticker.trade_price,
        priceChangePercent: data.ticker.signed_change_rate * 100,
        buyProbability: 0,
      }
    : undefined;
  return (
    <section className="panel chart-panel crypto-panel">
      <div className="section-heading">
        <div>
          <h1>코인 시세</h1>
          <p>업비트 원화 마켓 · 20초마다 갱신</p>
        </div>
      </div>
      <div className="periods" aria-label="코인 선택">
        {coinMarkets.map(coin => (
          <button
            key={coin.symbol}
            className={symbol === coin.symbol ? "chosen" : ""}
            aria-pressed={symbol === coin.symbol}
            onClick={() => setSymbol(coin.symbol)}
          >
            {coin.name}
          </button>
        ))}
      </div>
      <div className="periods" aria-label="차트 기간">
        {PERIODS.map(value => (
          <button
            key={value}
            className={period === value ? "chosen" : ""}
            aria-pressed={period === value}
            onClick={() => setPeriod(value)}
          >
            {value}
          </button>
        ))}
      </div>
      {state.key === key && state.error && (
        <p role="alert">
          {state.error}{" "}
          <button type="button" onClick={() => setRetry(value => value + 1)}>
            다시 시도
          </button>
        </p>
      )}
      {!data && !(state.key === key && state.error) && (
        <p role="status">{coin.name} 시세를 불러오는 중…</p>
      )}
      {data && stock && (
        <>
          <div className="chart-header">
            <div className="stock-heading">
              <h2>
                {coin.name} <small>{symbol} · UPBIT</small>
              </h2>
            </div>
            <div className="price-heading">
              ₩{formatNumber(stock.price)}
              <span className={stock.priceChangePercent >= 0 ? "positive" : "negative"}>
                {stock.priceChangePercent > 0 ? "+" : ""}
                {stock.priceChangePercent.toFixed(2)}% <small>전일 종가 대비</small>
              </span>
            </div>
          </div>
          <PriceChart key={key} stock={stock} chartPeriod={period} liveCandles={data.candles} />
          <div className="chart-stats">
            <div>
              당일 최고가<strong>₩{formatNumber(data.ticker.high_price)}</strong>
            </div>
            <div>
              당일 최저가<strong>₩{formatNumber(data.ticker.low_price)}</strong>
            </div>
            <div>
              24시간 거래대금
              <strong>{(data.ticker.acc_trade_price_24h / 100_000_000).toFixed(1)}억 원</strong>
            </div>
          </div>
          <p className="crypto-source">
            업비트 실제 시세 · 마지막 조회 {new Date(data.updatedAt).toLocaleTimeString("ko-KR")}{" "}
            {state.error ? "· 갱신 실패, 이전 조회 데이터" : ""} ·{" "}
            {period === "1년"
              ? "주봉"
              : period === "1개월"
                ? "일봉"
                : period === "1주"
                  ? "4시간봉"
                  : period === "1일"
                    ? "15분봉"
                    : "1분봉"}
          </p>
        </>
      )}
    </section>
  );
}
