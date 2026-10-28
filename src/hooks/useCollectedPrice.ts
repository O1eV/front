import { useEffect, useState } from 'react';
import { getCollectedPrice, type CollectedPrice } from '../api/coinChart';

export function useCollectedPrice(symbol: string) {
    const [result, setResult] = useState<{
        symbol: string;
        data?: CollectedPrice;
        error?: string;
    }>();

    useEffect(() => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        async function load() {
            try {
                const data = await getCollectedPrice(
                    symbol,
                    AbortSignal.any([controller.signal, AbortSignal.timeout(3000)])
                );
                if (
                    data.symbol !== symbol ||
                    !Number.isFinite(data.price) ||
                    data.price <= 0 ||
                    !Number.isFinite(Date.parse(data.tradeTimestamp)) ||
                    typeof data.stale !== 'boolean' ||
                    !Number.isFinite(Date.parse(data.updatedAt))
                )
                    throw new Error('수집 시세 응답을 확인해주세요.');
                if (!controller.signal.aborted) setResult({ symbol, data });
            } catch (error) {
                if (!controller.signal.aborted)
                    setResult(previous => ({
                        symbol,
                        data:
                            previous?.symbol === symbol && previous.data
                                ? { ...previous.data, stale: true }
                                : undefined,
                        error:
                            error instanceof Error
                                ? error.message
                                : '수집 시세 연결을 확인해주세요.',
                    }));
            } finally {
                // 이전 요청이 끝난 뒤 예약하므로 느린 연결에서도 중복 요청이 쌓이지 않는다.
                if (!controller.signal.aborted) timer = setTimeout(load, 1000);
            }
        }
        void load();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [symbol]);

    return result?.symbol === symbol ? result : undefined;
}
