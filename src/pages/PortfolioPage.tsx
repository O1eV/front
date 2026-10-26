import { useState } from "react";
import { ServerPortfolioWorkspace } from "../components/portfolio/ServerPortfolioWorkspace";
import { useSearchParams } from "react-router-dom";
import { useDashboardContext } from "../hooks/useDashboardContext";
import { usePaperPortfolio } from "../hooks/usePaperPortfolio";
import { sampleStocks } from "../data/markets";
import { AccountSummary } from "../components/portfolio/AccountSummary";
import { HoldingsTable } from "../components/portfolio/HoldingsTable";
import { PaperOrderForm } from "../components/portfolio/PaperOrderForm";
import { LocalOrderHistory } from "../components/portfolio/LocalOrderHistory";
import { ResetAccount } from "../components/portfolio/ResetAccount";
import "../styles/trading.css";

export function PortfolioPage() {
  const [mode, setMode] = useState<"server" | "local">("server");
  const [params] = useSearchParams();
  const { selectedStock } = useDashboardContext();
  const initialSymbol =
    sampleStocks.find(stock => stock.symbol === params.get("symbol"))?.symbol ??
    selectedStock.symbol;
  return (
    <>
      <div className="periods" aria-label="모의투자 방식">
        <button
          className={mode === "server" ? "chosen" : ""}
          aria-pressed={mode === "server"}
          onClick={() => setMode("server")}
        >
          서버 모의투자
        </button>
        <button
          className={mode === "local" ? "chosen" : ""}
          aria-pressed={mode === "local"}
          onClick={() => setMode("local")}
        >
          브라우저 연습
        </button>
      </div>
      {mode === "server" ? (
        <ServerPortfolioWorkspace initialSymbol={params.get("symbol") ?? "KRW-BTC"} />
      ) : (
        <PortfolioWorkspace key={initialSymbol} initialSymbol={initialSymbol} />
      )}
    </>
  );
}

function PortfolioWorkspace({ initialSymbol }: { initialSymbol: string }) {
  const portfolio = usePaperPortfolio(initialSymbol);

  return (
    <div className="trading-page">
      <div className="demo-notice">
        가상 자금 1,000만 원으로 연습해보세요. 샘플 가격으로 즉시 체결되며 수수료는 제외됩니다.
        계좌는 현재 브라우저 탭에만 저장됩니다.
      </div>

      {portfolio.storageError && (
        <p role="alert">
          브라우저 저장을 사용할 수 없어 페이지를 새로고침하면 계좌가 초기화됩니다.
        </p>
      )}

      <AccountSummary {...portfolio} />

      <div className="paper-grid">
        <div className="paper-records">
          <HoldingsTable {...portfolio} />
          <LocalOrderHistory {...portfolio} />
          <ResetAccount {...portfolio} />
        </div>

        <PaperOrderForm {...portfolio} />
      </div>
    </div>
  );
}
