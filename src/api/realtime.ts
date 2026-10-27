import { Client, ReconnectionTimeMode } from '@stomp/stompjs';

export type SignalValue = 'BUY' | 'HOLD' | 'SELL';
export interface PriceEvent {
    type: 'PRICE';
    symbol: string;
    price: number;
    changeRate: number | null;
    volume: number | null;
    time: string;
}
export interface SignalEvent {
    type: 'SIGNAL';
    symbol: string;
    previousSignal: SignalValue | null;
    signal: SignalValue;
    confidence: number;
    probabilities: { buy: number; hold: number; sell: number } | null;
    generatedAt: string;
    stale: boolean;
}
export interface AlertEvent {
    type: 'SIGNAL_CHANGED';
    symbol: string;
    from: SignalValue;
    to: SignalValue;
    confidence: number;
    time: string;
}
const isSignal = (value: unknown): value is SignalValue =>
    ['BUY', 'HOLD', 'SELL'].includes(String(value));
const isTime = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value));
const isProbability = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;

export function parseRealtimeMessage(
    destination: string,
    body: string
): PriceEvent | SignalEvent | AlertEvent | undefined {
    try {
        const data = JSON.parse(body);
        if (!data || typeof data !== 'object' || typeof data.symbol !== 'string') return;
        if (
            destination.startsWith('/topic/prices/') &&
            destination === `/topic/prices/${data.symbol}`
        ) {
            if (!Number.isFinite(data.price) || data.price <= 0 || !isTime(data.time)) return;
            return {
                type: 'PRICE',
                symbol: data.symbol,
                price: data.price,
                time: data.time,
                changeRate: Number.isFinite(data.changeRate) ? data.changeRate : null,
                volume: Number.isFinite(data.volume) && data.volume >= 0 ? data.volume : null,
            };
        }
        if (
            destination.startsWith('/topic/signals/') &&
            destination === `/topic/signals/${data.symbol}`
        ) {
            const generatedAt = data.generatedAt ?? data.time;
            if (!isSignal(data.signal) || !isProbability(data.confidence) || !isTime(generatedAt))
                return;
            const probabilities = data.probabilities;
            if (
                probabilities != null &&
                ![probabilities.buy, probabilities.hold, probabilities.sell].every(isProbability)
            )
                return;
            return {
                type: 'SIGNAL',
                symbol: data.symbol,
                signal: data.signal,
                confidence: data.confidence,
                previousSignal: isSignal(data.previousSignal) ? data.previousSignal : null,
                probabilities:
                    probabilities == null
                        ? null
                        : {
                              buy: probabilities.buy,
                              hold: probabilities.hold,
                              sell: probabilities.sell,
                          },
                generatedAt,
                stale: data.stale === true,
            };
        }
        if (
            destination === '/user/queue/alerts' &&
            data.type === 'SIGNAL_CHANGED' &&
            isSignal(data.from) &&
            isSignal(data.to) &&
            isProbability(data.confidence) &&
            isTime(data.time)
        )
            return {
                type: 'SIGNAL_CHANGED',
                symbol: data.symbol,
                from: data.from,
                to: data.to,
                confidence: data.confidence,
                time: data.time,
            };
    } catch {
        /* 형식이 잘못된 프레임은 화면에 반영하지 않는다. */
    }
}

export function createRealtimeClient(token?: string) {
    const url = new URL(import.meta.env.VITE_WS_URL || '/ws', window.location.href);
    url.protocol = url.protocol === 'https:' || url.protocol === 'wss:' ? 'wss:' : 'ws:';
    return new Client({
        brokerURL: url.toString(),
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        reconnectDelay: 1000,
        maxReconnectDelay: 30000,
        reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
        connectionTimeout: 10000,
        debug: () => {},
    });
}
