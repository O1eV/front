import { StockPage } from './StockPage';
import { MarketCatalog } from '../components/market/MarketCatalog';
import { CryptoPage } from './CryptoPage';

export function MarketPage() {
    return (
        <div className="market-home">
            <StockPage embedded />
            <MarketCatalog />
            <CryptoPage />
        </div>
    );
}
