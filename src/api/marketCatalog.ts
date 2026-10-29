import { demoStocks } from './demoStocks';
import { getMarkets, type MarketFilters, type MarketList } from './markets';

export interface CatalogPage extends MarketList {
    stocks: typeof demoStocks;
}

// 국내 주식을 앞에 붙인 통합 목록을 코인과 같은 20행 기준으로 페이지 분할합니다.
export async function getCatalogPage(
    filters: MarketFilters,
    signal: AbortSignal,
    token?: string
): Promise<CatalogPage> {
    const size = 20;
    const eligibleStocks =
        (filters.assetClass === '' || filters.assetClass === 'KR_STOCK') &&
        !filters.marketState &&
        !filters.signal
            ? demoStocks
            : [];
    const offset = filters.page * size;
    const stocks = eligibleStocks.slice(offset, offset + size);
    if (filters.assetClass === 'KR_STOCK') {
        return {
            stocks,
            items: [],
            page: filters.page,
            size,
            totalElements: eligibleStocks.length,
        };
    }
    const coinOffset = Math.max(0, offset - eligibleStocks.length);
    const coinPage = Math.floor(coinOffset / size);
    const first = await getMarkets({ ...filters, page: coinPage }, signal, token);
    const withinPage = coinOffset % size;
    const required = size - stocks.length;
    let items = first.items.slice(withinPage, withinPage + required);
    if (items.length < required && (coinPage + 1) * size < first.totalElements) {
        const second = await getMarkets({ ...filters, page: coinPage + 1 }, signal, token);
        items = [...items, ...second.items.slice(0, required - items.length)];
    }
    return {
        stocks,
        items,
        page: filters.page,
        size,
        totalElements: first.totalElements + eligibleStocks.length,
    };
}
