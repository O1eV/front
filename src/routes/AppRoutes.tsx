import { Route, Routes } from 'react-router-dom';
import App from '../App';
import { MarketPage } from '../pages/MarketPage';
import { MarketListPage } from '../pages/MarketListPage';
import { PortfolioPage } from '../pages/PortfolioPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { pagePaths } from './paths';

export function AppRoutes() {
    return (
        <Routes>
            <Route path="/" element={<App />}>
                <Route index element={<MarketPage />} />
                <Route
                    path={pagePaths['관심 종목']}
                    element={<MarketListPage page="관심 종목" />}
                />
                <Route
                    path={pagePaths['신호 이력']}
                    element={<MarketListPage page="신호 이력" />}
                />
                <Route path={pagePaths['모의 포트폴리오']} element={<PortfolioPage />} />
                <Route path="*" element={<NotFoundPage />} />
            </Route>
        </Routes>
    );
}
