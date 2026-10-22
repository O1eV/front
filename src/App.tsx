import { CryptoPage } from "./pages/CryptoPage";
import { Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { MarketPage } from "./pages/MarketPage";
import { MarketListPage } from "./pages/MarketListPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { pagePaths } from "./routes/paths";

import { AuthPage } from "./pages/AuthPage";
import "./App.css";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<AuthPage key="login" mode="login" />} />
      <Route path="/signup" element={<AuthPage key="signup" mode="signup" />} />

      <Route path="/" element={<AppLayout />}>
        <Route index element={<MarketPage />} />
        <Route path="/crypto" element={<CryptoPage />} />
        <Route path={pagePaths["관심 종목"]} element={<MarketListPage page="관심 종목" />} />
        <Route path={pagePaths["신호 이력"]} element={<MarketListPage page="신호 이력" />} />
        <Route path={pagePaths["모의 포트폴리오"]} element={<PortfolioPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
