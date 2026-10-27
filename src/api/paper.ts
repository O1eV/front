import { apiClient } from './apiClient';
import type { SignalValue } from './realtime';
export interface PaperOrderRecord {
    orderId: number;
    symbol: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    fee: number | null;
    signalAtOrder: SignalValue | null;
    executedAt: string;
}
export interface PaperOrderHistory {
    items: PaperOrderRecord[];
    page: number;
    size: number;
    totalElements: number;
}
export function getPaperOrders(
    token: string,
    signal: AbortSignal,
    filters: { symbol: string; page: number; size: number }
) {
    const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) });
    if (filters.symbol.trim()) params.set('symbol', filters.symbol.trim().toUpperCase());
    return apiClient<PaperOrderHistory>(`paper/orders?${params}`, { token, signal });
}

export interface ServerHolding {
    symbol: string;
    quantity: number;
    averagePurchasePrice: number;
    purchaseAmount: number;
    currentPrice: number;
    evaluationAmount: number;
    profitLoss: number;
    returnRate: number;
}
export interface ServerPortfolio {
    currency: string;
    cashBalance: number;
    totalPurchaseAmount: number;
    totalEvaluationAmount: number;
    totalProfitLoss: number;
    totalReturnRate: number;
    totalAssetAmount: number;
    holdings: ServerHolding[];
}
export const getPaperPortfolio = (token: string, signal?: AbortSignal) =>
    apiClient<ServerPortfolio>('paper/portfolio', { token, signal });
export const resetPaperAccount = (token: string) =>
    apiClient<{ cashBalance: number }>('paper/reset', { token, method: 'POST' });
export const placePaperOrder = (
    token: string,
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number
) =>
    apiClient<PaperOrderRecord>('paper/orders', {
        token,
        method: 'POST',
        body: { symbol, side, orderType: 'MARKET', quantity },
    });
