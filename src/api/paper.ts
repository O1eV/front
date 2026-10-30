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

export async function getPaperOrders(
    token: string,
    signal: AbortSignal,
    filters: { symbol: string; page: number; size: number }
) {
    const params = new URLSearchParams({ page: String(filters.page), size: String(filters.size) });

    if (filters.symbol.trim()) params.set('symbol', filters.symbol.trim().toUpperCase());

    const data = await apiClient<PaperOrderHistoryResponse>(`paper/orders?${params}`, {
        token,
        signal,
    });

    return toPaperOrderHistory(data);
}

type PaperOrderHistoryResponse = {
    orders: (Omit<PaperOrderRecord, 'executedAt' | 'fee' | 'signalAtOrder'> & {
        orderedAt: string;
    })[];
    pageInfo: Omit<PaperOrderHistory, 'items'>;
};

export function toPaperOrderHistory(data: PaperOrderHistoryResponse): PaperOrderHistory {
    if (
        !data ||
        !Array.isArray(data.orders) ||
        !data.pageInfo ||
        !Number.isInteger(data.pageInfo.page) ||
        data.pageInfo.page < 0 ||
        !Number.isInteger(data.pageInfo.size) ||
        data.pageInfo.size <= 0 ||
        !Number.isInteger(data.pageInfo.totalElements) ||
        data.pageInfo.totalElements < 0
    )
        throw new Error('거래 내역 응답을 확인할 수 없어요.');

    const items = data.orders.map(order => {
        if (
            !order ||
            !Number.isSafeInteger(order.orderId) ||
            order.orderId <= 0 ||
            (order.side !== 'BUY' && order.side !== 'SELL') ||
            typeof order.orderedAt !== 'string' ||
            typeof order.symbol !== 'string' ||
            ![order.quantity, order.price].every(Number.isFinite) ||
            !Number.isFinite(Date.parse(order.orderedAt))
        )
            throw new Error('거래 내역 응답을 확인할 수 없어요.');

        // 현재 API에는 수수료·당시 신호 필드가 없어 미기록으로 표시한다.
        return { ...order, executedAt: order.orderedAt, fee: null, signalAtOrder: null };
    });

    return { ...data.pageInfo, items } satisfies PaperOrderHistory;
}

export interface ServerHolding {
    symbol: string;
    quantity: number;
    averagePurchasePrice: number;
    purchaseAmount: number;
    currentPrice: number;
    priceAvailable: boolean;
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
    pricesComplete: boolean;
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
