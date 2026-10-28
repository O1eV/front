import { MarketCatalog } from '../components/market/MarketCatalog';
import { CryptoPage } from './CryptoPage';

export function MarketPage() {
    return (
        <div className="market-home">
            <MarketCatalog />
            <CryptoPage />
        </div>
    );
}
