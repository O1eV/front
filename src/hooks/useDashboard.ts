import { useState } from 'react';
import { sampleStocks } from '../data/markets';
import type { Stock, MarketFilter, ChartPeriod } from '../types/market';

export function useDashboard() {
    const [selectedStock, setSelectedStock] = useState<Stock>(sampleStocks[0]);
    const [searchQuery, setSearchQuery] = useState('');
    const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1일');
    const [favoriteSymbols, setFavoriteSymbols] = useState<string[]>(['005930', '000660']);
    const [signalFilter, setSignalFilter] = useState<MarketFilter>('전체');
    const [toastMessage, setToastMessage] = useState('');

    function toggleFavorite(symbol: string) {
        setFavoriteSymbols(currentSymbols => {
            const isAlreadyFavorite = currentSymbols.includes(symbol);
            if (isAlreadyFavorite) {
                return currentSymbols.filter(favoriteSymbol => favoriteSymbol !== symbol);
            }
            return [...currentSymbols, symbol];
        });
    }

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const filteredStocks = sampleStocks.filter(stock => {
        const matchesQuery = `${stock.name}${stock.symbol}`
            .toLowerCase()
            .includes(normalizedSearchQuery);
        const matchesSignal = signalFilter !== '매수 신호' || stock.buyProbability > 50;
        return matchesQuery && matchesSignal;
    });

    return {
        selectedStock,
        setSelectedStock,
        searchQuery,
        setSearchQuery,
        chartPeriod,
        setChartPeriod,
        favoriteSymbols,
        toggleFavorite,
        signalFilter,
        setSignalFilter,
        filteredStocks,
        toastMessage,
        setToastMessage,
    };
}
