import { apiClient } from './apiClient';
import { mapCandles, type CollectedPrice } from './coinChart';

export const demoStocks = [
    {
        symbol: '005930',
        koreanName: '삼성전자',
        englishName: 'Samsung Electronics',
        assetClass: 'KR_STOCK' as const,
    },
    {
        symbol: '000660',
        koreanName: 'SK하이닉스',
        englishName: 'SK hynix',
        assetClass: 'KR_STOCK' as const,
    },
    {
        symbol: '035420',
        koreanName: 'NAVER · 네이버',
        englishName: 'NAVER',
        assetClass: 'KR_STOCK' as const,
    },
    {
        symbol: '247540',
        koreanName: '에코프로비엠',
        englishName: 'Ecopro BM',
        assetClass: 'KR_STOCK' as const,
    },
];

function requireStock(code: string) {
    if (!/^\d{6}$/.test(code)) throw new Error('지원하지 않는 데모 종목입니다.');
}

export async function getDemoStockPrice(code: string, token: string, signal: AbortSignal) {
    requireStock(code);
    const data = await apiClient<CollectedPrice & { changeRate?: number | null }>(
        `demo/stocks/${code}/price`,
        { token, signal }
    );
    if (
        data.symbol !== code ||
        !Number.isFinite(data.price) ||
        data.price <= 0 ||
        !Number.isFinite(Date.parse(data.updatedAt)) ||
        !Number.isFinite(Date.parse(data.tradeTimestamp)) ||
        typeof data.stale !== 'boolean'
    )
        throw new Error('주식 현재가 응답을 확인할 수 없어요.');
    if (data.changeRate != null && !Number.isFinite(data.changeRate))
        throw new Error('주식 등락률 응답을 확인할 수 없어요.');
    return data;
}

export async function getDemoStockCandles(code: string, token: string, signal: AbortSignal) {
    requireStock(code);
    const data = await apiClient<{
        symbol: string;
        interval: string;
        candles: Parameters<typeof mapCandles>[0];
    }>(`demo/stocks/${code}/candles?interval=1m&limit=300`, { token, signal });
    if (data.symbol !== code || data.interval !== '1m')
        throw new Error('요청한 종목의 1분봉 응답이 아니에요.');
    return mapCandles(data.candles);
}
