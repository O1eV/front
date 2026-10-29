import { useEffect, useState } from 'react';
import { ApiError } from '../api/apiClient';
import { getDemoStockCandles, getDemoStockPrice } from '../api/demoStocks';

interface Resource<T> {
    data?: T;
    error?: string;
    updatedAt?: number;
}
interface Snapshot {
    price: Resource<Awaited<ReturnType<typeof getDemoStockPrice>>>;
    candles: Resource<Awaited<ReturnType<typeof getDemoStockCandles>>>;
}
function describeError(error: unknown) {
    if (error instanceof ApiError) {
        if (error.status === 401) return '로그인이 만료됐어요. 다시 로그인해주세요.';
        if (error.status === 403) return '데모 주식 시세 조회 권한을 확인해주세요.';
        if (error.status === 404)
            return '이 서버에서 데모 주식 API 또는 해당 종목을 제공하지 않아요.';
        if (error.code === 'COLLECTOR_UNAVAILABLE' || error.status === 503)
            return '시세 수집 대기 중이에요. 장 마감 또는 수집 전에는 데이터가 없을 수 있어요.';
    }
    return error instanceof Error ? error.message : '시세를 불러오지 못했어요.';
}

export function useDemoStock(code: string, token: string) {
    const [retry, setRetry] = useState(0);
    const [snapshot, setSnapshot] = useState<Snapshot>({ price: {}, candles: {} });
    useEffect(() => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        async function load() {
            const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]);
            // 현재가 캐시가 만료되어도 저장된 분봉은 독립적으로 표시합니다.
            const [price, candles] = await Promise.allSettled([
                getDemoStockPrice(code, token, signal),
                getDemoStockCandles(code, token, signal),
            ]);
            if (controller.signal.aborted) return;
            setSnapshot(previous => ({
                price:
                    price.status === 'fulfilled'
                        ? { data: price.value, updatedAt: Date.now() }
                        : { ...previous.price, error: describeError(price.reason) },
                candles:
                    candles.status === 'fulfilled'
                        ? { data: candles.value, updatedAt: Date.now() }
                        : { ...previous.candles, error: describeError(candles.reason) },
            }));
            timer = setTimeout(load, 10_000);
        }
        void load();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [code, token, retry]);
    return { ...snapshot, reload: () => setRetry(value => value + 1) };
}
