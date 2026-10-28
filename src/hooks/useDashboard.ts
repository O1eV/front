import { useLocation, useSearchParams } from 'react-router-dom';
import { useState } from 'react';
import { useRealtime } from './useRealtime';
import { useWatchlist } from './useWatchlist';
import { sampleStocks } from '../data/markets';
import type { Stock, MarketFilter, ChartPeriod } from '../types/market';

export function useDashboard() {
    const [lastSelectedStock, setLastSelectedStock] = useState<Stock>(sampleStocks[0]);
    const [params, setParams] = useSearchParams();
    const { pathname } = useLocation();
    const selectedStock =
        sampleStocks.find(stock => stock.symbol === params.get('symbol')) ?? lastSelectedStock;

    function setSelectedStock(stock: Stock) {
        setLastSelectedStock(stock);
        if (pathname === '/') {
            setParams(previous => {
                previous.set('symbol', stock.symbol);
                return previous;
            });
        }
    }
    const [searchQuery, setSearchQuery] = useState('');
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1일');

    const [signalFilter, setSignalFilter] = useState<MarketFilter>('전체');
    const [toastMessage, setToastMessage] = useState('');

    const watchlist = useWatchlist(setToastMessage);

    const realtimeSymbol = ['KRW-BTC', 'KRW-ETH', 'KRW-XRP'].includes(params.get('symbol') ?? '')
        ? params.get('symbol')!
        : 'KRW-BTC';
    const realtime = useRealtime(realtimeSymbol, pathname === '/' || pathname === '/crypto');

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const filteredStocks = sampleStocks.filter(stock => {
        const matchesQuery = `${stock.name}${stock.symbol}`
            .toLowerCase()
            .includes(normalizedSearchQuery);

        const matchesSignal = signalFilter !== '매수 신호' || stock.buyProbability > 50;

        return matchesQuery && matchesSignal;
    });

    return {
        realtime,
        selectedStock,
        setSelectedStock,
        searchQuery,
        setSearchQuery,
        chartPeriod,
        setChartPeriod,
        ...watchlist,
        signalFilter,
        setSignalFilter,
        filteredStocks,
        toastMessage,
        setToastMessage,
    };
}
