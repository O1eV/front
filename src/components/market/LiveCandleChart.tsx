import { useEffect, useRef } from 'react';
import {
    createChart,
    CandlestickSeries,
    HistogramSeries,
    createSeriesMarkers,
    type ISeriesMarkersPluginApi,
    type Time,
    type IChartApi,
    type ISeriesApi,
    type UTCTimestamp,
    type SeriesMarker,
} from 'lightweight-charts';
import type { Candle } from '../../data/candles';
import type { PriceEvent } from '../../api/realtime';

const candleSeconds = { '1m': 60, '5m': 300, '15m': 900, '1h': 3600, '1d': 86400 };
export type CandleInterval = keyof typeof candleSeconds;
interface Props {
    candles: Candle[];
    interval: CandleInterval;
    tick?: PriceEvent;
    signal?: { signal: string; generatedAt: string };
}
export function LiveCandleChart({ candles, interval, tick, signal }: Props) {
    const container = useRef<HTMLDivElement>(null);
    const chart = useRef<IChartApi | null>(null);
    const series = useRef<ISeriesApi<'Candlestick'> | null>(null);
    const volumes = useRef<ISeriesApi<'Histogram'> | null>(null);
    const last = useRef<{
        time: UTCTimestamp;
        open: number;
        high: number;
        low: number;
        close: number;
    } | null>(null);
    const latestTick = useRef<PriceEvent | undefined>(undefined);
    const markers = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
    const history = useRef<SeriesMarker<UTCTimestamp>[]>([]);
    const fitted = useRef(false);
    useEffect(() => {
        if (!container.current) return;
        const instance = createChart(container.current, {
            autoSize: true,
            height: 380,
            layout: { background: { color: '#ffffff' }, textColor: '#667085' },
            grid: { vertLines: { color: '#f2f4f7' }, horzLines: { color: '#f2f4f7' } },
            localization: {
                locale: 'ko-KR',
                timeFormatter: (time: Time) =>
                    typeof time === 'number'
                        ? new Date(time * 1000).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })
                        : typeof time === 'string'
                          ? time
                          : `${time.year}-${time.month}-${time.day}`,
                priceFormatter: (price: number) =>
                    price.toLocaleString('ko-KR', { maximumFractionDigits: 8 }),
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                tickMarkFormatter: (time: Time, type: number) => {
                    if (typeof time !== 'number')
                        return typeof time === 'string' ? time : `${time.month}/${time.day}`;
                    const date = new Date(time * 1000);
                    return type >= 3
                        ? date.toLocaleTimeString('ko-KR', {
                              timeZone: 'Asia/Seoul',
                              hour: '2-digit',
                              minute: '2-digit',
                              hour12: false,
                          })
                        : date.toLocaleDateString('ko-KR', {
                              timeZone: 'Asia/Seoul',
                              month: 'numeric',
                              day: 'numeric',
                          });
                },
            },
        });
        chart.current = instance;
        series.current = instance.addSeries(CandlestickSeries, {
            upColor: '#f04452',
            downColor: '#3182f6',
            borderVisible: false,
            wickUpColor: '#f04452',
            wickDownColor: '#3182f6',
        });
        volumes.current = instance.addSeries(HistogramSeries, {
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
            lastValueVisible: false,
            priceLineVisible: false,
        });
        instance.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
        markers.current = createSeriesMarkers(series.current, []);
        return () => {
            markers.current?.detach();
            instance.remove();
            chart.current = null;
            series.current = null;
            volumes.current = null;
            fitted.current = false;
        };
    }, []);
    useEffect(() => {
        const values = candles.map(candle => ({
            time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
        }));
        series.current?.setData(values);
        volumes.current?.setData(
            candles.map(candle => ({
                time: Math.floor(candle.timestamp / 1000) as UTCTimestamp,
                value: candle.volume,
                color: candle.close >= candle.open ? '#f0445244' : '#3182f644',
            }))
        );
        last.current = values.at(-1) ?? null;
        const price = latestTick.current;
        if (
            price &&
            last.current &&
            Math.floor(Date.parse(price.time) / 1000 / candleSeconds[interval]) *
                candleSeconds[interval] ===
                last.current.time
        ) {
            last.current = {
                ...last.current,
                high: Math.max(last.current.high, price.price),
                low: Math.min(last.current.low, price.price),
                close: price.price,
            };
            series.current?.update(last.current);
        }
        if (!fitted.current && values.length) {
            // 수집 직후 1~2개 봉도 최소 60개 슬롯에 표시해 과도한 확대를 방지합니다.
            chart.current?.timeScale().setVisibleLogicalRange({
                from: values.length - Math.max(60, values.length),
                to: values.length + 3,
            });
            fitted.current = true;
        }
    }, [candles, interval]);
    useEffect(() => {
        if (!tick || !last.current) return;
        if (latestTick.current && Date.parse(tick.time) < Date.parse(latestTick.current.time))
            return;
        latestTick.current = tick;
        const time =
            Math.floor(Date.parse(tick.time) / 1000 / candleSeconds[interval]) *
            candleSeconds[interval];
        // 새 봉의 정확한 시가·거래량은 REST에서 받고 현재 봉의 가격만 즉시 갱신한다.
        if (time !== last.current.time) return;
        last.current = {
            ...last.current,
            high: Math.max(last.current.high, tick.price),
            low: Math.min(last.current.low, tick.price),
            close: tick.price,
        };
        series.current?.update(last.current);
    }, [tick, interval]);
    useEffect(() => {
        if (!signal || !candles.length) return;
        const time = (Math.floor(Date.parse(signal.generatedAt) / 1000 / candleSeconds[interval]) *
            candleSeconds[interval]) as UTCTimestamp;
        if (
            time < candles[0].timestamp / 1000 ||
            time > candles[candles.length - 1].timestamp / 1000
        )
            return;
        const marker: SeriesMarker<UTCTimestamp> = {
            time,
            position: signal.signal === 'SELL' ? 'aboveBar' : 'belowBar',
            color:
                signal.signal === 'BUY'
                    ? '#f04452'
                    : signal.signal === 'SELL'
                      ? '#3182f6'
                      : '#667085',
            shape:
                signal.signal === 'BUY'
                    ? 'arrowUp'
                    : signal.signal === 'SELL'
                      ? 'arrowDown'
                      : 'circle',
            text: signal.signal,
        };
        history.current = [...history.current.filter(item => item.time !== time), marker]
            .sort((a, b) => Number(a.time) - Number(b.time))
            .slice(-500);
        markers.current?.setMarkers(history.current);
    }, [signal, candles, interval]);
    return (
        <div
            ref={container}
            className="live-candle-chart"
            role="img"
            aria-label="실제 OHLCV 캔들 및 거래량 차트"
        />
    );
}
