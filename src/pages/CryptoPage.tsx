import { useCollectedPrice } from "../hooks/useCollectedPrice";
import { Icon } from "../components/ui/Icon";
import { useDashboardContext } from "../hooks/useDashboardContext";
import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { coinMarkets } from "../api/upbit";
import { chartIntervals, getCoinChart } from "../api/coinChart";
import { PriceChart } from "../components/market/PriceChart";
import { PERIODS, type ChartPeriod, type Stock } from "../types/market";
import { formatNumber } from "../utils/format";

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
  const collected = useCollectedPrice(symbol);
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
  const live = collected?.data && !collected.data.stale ? collected.data : undefined;
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
          <p>수집 현재가 1초 · 원화 마켓 · 차트 20초 갱신</p>
        </div>
      </div>

      <p className="crypto-source" role="status">
        {live
          ? `수집 시세 연결됨 · ${new Date(live.updatedAt).toLocaleTimeString("ko-KR")}`
          : collected?.error
            ? `${collected.error} 기존 API 시세를 표시합니다.`
            : collected?.data?.stale
              ? "수집 시세 갱신이 지연되어 기존 API 시세를 표시합니다."
              : "수집 시세 연결 중…"}
      </p>

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

          <PriceChart key={key} stock={stock} chartPeriod={period} liveCandles={data.candles} />

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
            {state.error ? "· 갱신 실패, 이전 조회 데이터" : ""} · {chartIntervals[period].label}
          </p>
        </>
      )}
    </section>
  );
}
