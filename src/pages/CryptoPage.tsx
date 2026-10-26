import { LatestSignalPanel } from "../components/market/LatestSignalPanel";
import { RealtimePanel } from "../components/market/RealtimePanel";
import { Icon } from "../components/ui/Icon";
import { useDashboardContext } from "../hooks/useDashboardContext";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { coinMarkets } from "../api/upbit";
import { chartIntervals, getCoinChart } from "../api/coinChart";
import type { CandleInterval } from "../components/market/LiveCandleChart";
import type { LatestSignal } from "../api/signals";
import { useAuthSession } from "../lib/auth";
import { PERIODS, type ChartPeriod, type Stock } from "../types/market";
import { formatNumber } from "../utils/format";

const LiveCandleChart = lazy(() =>
  import("../components/market/LiveCandleChart").then(module => ({
    default: module.LiveCandleChart,
  }))
);

type ChartData = Awaited<ReturnType<typeof getCoinChart>>;

export function CryptoPage() {
  const [params] = useSearchParams();
  const initialSymbol =
    coinMarkets.find(coin => coin.symbol === params.get("symbol"))?.symbol ?? "KRW-BTC";
  return <CryptoWorkspace key={initialSymbol} initialSymbol={initialSymbol} />;
}

function CryptoWorkspace({ initialSymbol }: { initialSymbol: string }) {
  const dashboard = useDashboardContext();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [params, setParams] = useSearchParams();
  const realtime = dashboard.realtime;
  const [period, setPeriod] = useState<ChartPeriod>("1일");
  const [interval, setInterval] = useState<CandleInterval>("15m");
  const [latestSignal, setLatestSignal] = useState<LatestSignal>();
  const session = useAuthSession();
  const [retry, setRetry] = useState(0);
  const [state, setState] = useState<{ key: string; data?: ChartData; error?: string }>({
    key: "",
  });

  const key = `${symbol}:${period}:${interval}`;

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;

    async function load() {
      try {
        const data = await getCoinChart(
          symbol,
          period,
          AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]),
          interval
        );

        if (!controller.signal.aborted) setState({ key: `${symbol}:${period}:${interval}`, data });
      } catch (error) {
        if (!controller.signal.aborted)
          setState(previous => ({
            key: `${symbol}:${period}:${interval}`,
            data: previous.key === `${symbol}:${period}:${interval}` ? previous.data : undefined,
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
  }, [symbol, period, interval, retry]);

  const data = state.key === key ? state.data : undefined;
  const coin = coinMarkets.find(coin => coin.symbol === symbol)!;
  const live =
    realtime?.status === "connected" && realtime.price?.symbol === symbol
      ? { ...realtime.price, updatedAt: realtime.price.time }
      : undefined;
  const previousClose = data ? data.ticker.price / (1 + data.ticker.changeRate) : undefined;
  const currentPrice = live?.price ?? data?.ticker.price;
  const currentChangeRate =
    currentPrice != null && previousClose && previousClose > 0
      ? currentPrice / previousClose - 1
      : data?.ticker.changeRate;
  const stock: Stock | undefined = data
    ? {
        ...coin,
        exchange: "UPBIT",
        price: currentPrice ?? data.ticker.price,
        priceChangePercent: (currentChangeRate ?? data.ticker.changeRate) * 100,
        buyProbability: 0,
      }
    : undefined;

  return (
    <section className="panel chart-panel crypto-panel">
      <div className="section-heading">
        <div>
          <h1>코인 시세</h1>
          <p>실시간 WebSocket 시세 · 원화 마켓 · 차트 20초 갱신</p>
        </div>
      </div>

      <RealtimePanel />
      <LatestSignalPanel key={symbol} symbol={symbol} onLatest={setLatestSignal} />

      <div className="periods" aria-label="코인 선택">
        {coinMarkets.map(coin => (
          <button
            key={coin.symbol}
            className={symbol === coin.symbol ? "chosen" : ""}
            aria-pressed={symbol === coin.symbol}
            onClick={() => {
              setSymbol(coin.symbol);
              const next = new URLSearchParams(params);
              next.set("symbol", coin.symbol);
              setParams(next);
            }}
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
            onClick={() => {
              setPeriod(value);
              setInterval(chartIntervals[value].interval as CandleInterval);
            }}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="periods" aria-label="봉 단위">
        {(["1m", "5m", "15m", "1h", "1d"] as const).map(value => (
          <button
            key={value}
            className={interval === value ? "chosen" : ""}
            aria-pressed={interval === value}
            onClick={() => setInterval(value)}
          >
            {{ "1m": "1분", "5m": "5분", "15m": "15분", "1h": "1시간", "1d": "1일" }[value]}
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
              <h2>{coin.name}</h2>
              <button
                className={`star-button ${dashboard.favoriteSymbols.includes(symbol) ? "is-favorite" : ""}`}
                aria-label={`${symbol} 관심 ${dashboard.favoriteSymbols.includes(symbol) ? "해제" : "등록"}`}
                aria-pressed={dashboard.favoriteSymbols.includes(symbol)}
                disabled={dashboard.isWatchlistPending(symbol) || dashboard.watchlistLoading}
                onClick={() => void dashboard.toggleFavorite(symbol)}
              >
                <Icon name="star" size={17} />
              </button>
              <small className="crypto-symbol">{symbol} · UPBIT</small>
            </div>

            <div className="price-heading">
              ₩{formatNumber(stock.price)}
              <span className={stock.priceChangePercent >= 0 ? "positive" : "negative"}>
                {stock.priceChangePercent > 0 ? "+" : ""}
                {stock.priceChangePercent.toFixed(2)}% <small>전일 종가 대비</small>
              </span>
            </div>
          </div>

          <Suspense fallback={<p role="status">차트를 준비하는 중…</p>}>
            <LiveCandleChart
              key={key}
              candles={data.candles}
              interval={interval}
              tick={realtime?.price}
              signal={
                session
                  ? realtime?.signal &&
                    (!latestSignal ||
                      Date.parse(realtime.signal.generatedAt) >=
                        Date.parse(latestSignal.generatedAt))
                    ? realtime.signal
                    : latestSignal
                  : undefined
              }
            />
          </Suspense>

          <div className="chart-stats">
            <div>
              조회 구간 최고가
              <strong>₩{formatNumber(Math.max(...data.candles.map(candle => candle.high)))}</strong>
            </div>

            <div>
              조회 구간 최저가
              <strong>₩{formatNumber(Math.min(...data.candles.map(candle => candle.low)))}</strong>
            </div>
          </div>

          <p className="crypto-source">
            서버 API 시세 · 마지막 조회 {new Date(data.updatedAt).toLocaleTimeString("ko-KR")}{" "}
            {state.error ? "· 갱신 실패, 이전 조회 데이터" : ""} · {interval}
          </p>
        </>
      )}
    </section>
  );
}
