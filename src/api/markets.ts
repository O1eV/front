import { apiClient } from './apiClient';

export interface MarketSearchItem {
    symbol: string;
    koreanName: string;
    englishName: string;
    assetClass: AssetClass;
}

export function searchMarkets(query: string, signal: AbortSignal) {
    const params = new URLSearchParams({ q: query.trim(), limit: '10' });

    return apiClient<{ items: MarketSearchItem[] }>(`markets/search?${params}`, { signal });
}

export type AssetClass = 'COIN' | 'KR_STOCK' | 'US_STOCK';
export type MarketState = 'UP' | 'DOWN' | 'SIDEWAYS' | 'VOLATILE';
export type MarketSignal = 'BUY' | 'HOLD' | 'SELL';

export interface MarketItem {
    symbol: string;
    koreanName: string;
    englishName: string;
    assetClass: AssetClass;
    marketState: MarketState;
    price: number;
    changeRate: number;
    signal: MarketSignal | null;
    confidence: number | null;
}

export interface MarketFilters {
    assetClass: AssetClass | '';
    marketState: MarketState | '';
    signal: MarketSignal | '';
    page: number;
}

export interface MarketList {
    items: MarketItem[];
    page: number;
    size: number;
    totalElements: number;
}

export function getMarkets(filters: MarketFilters, signal: AbortSignal, token?: string) {
    const params = new URLSearchParams({ page: String(filters.page), size: '20' });

    for (const field of ['assetClass', 'marketState', 'signal'] as const) {
        if (filters[field]) params.set(field, filters[field]);
    }

    return apiClient<MarketList>(`markets?${params}`, { signal, token });
}
