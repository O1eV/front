import type { Stock } from '../types/market';

// UI 시연용 가상 가격입니다. 실제 시세나 현재 투자 판단을 나타내지 않습니다.
export const sampleStocks: Stock[] = [
    {
        name: '삼성전자',
        symbol: '005930',
        exchange: 'KOSPI',
        icon: '삼',
        color: '#1428a0',
        price: 72500,
        priceChangePercent: 1.4,
        buyProbability: 72,
    },
    {
        name: 'SK하이닉스',
        symbol: '000660',
        exchange: 'KOSPI',
        icon: 'SK',
        color: '#ea002c',
        price: 186000,
        priceChangePercent: 2.48,
        buyProbability: 81,
    },
    {
        name: 'NAVER',
        symbol: '035420',
        exchange: 'KOSPI',
        icon: 'N',
        color: '#03c75a',
        price: 215000,
        priceChangePercent: -0.92,
        buyProbability: 44,
    },
    {
        name: '에코프로비엠',
        symbol: '247540',
        exchange: 'KOSDAQ',
        icon: '에',
        color: '#0b558c',
        price: 172500,
        priceChangePercent: -1.43,
        buyProbability: 28,
    },
];
