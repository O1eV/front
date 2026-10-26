import { SignalHistoryPage } from "./SignalHistoryPage";
import { WatchlistPanel } from "../components/market/WatchlistPanel";

import { useDashboardContext } from "../hooks/useDashboardContext";

type MarketListPageProps = { page: "관심 종목" | "신호 이력" };

export function MarketListPage({ page }: MarketListPageProps) {
  const dashboard = useDashboardContext();
  return page === "신호 이력" ? (
    <SignalHistoryPage />
  ) : (
    <div className="panel">
      <WatchlistPanel dashboard={dashboard} />
    </div>
  );
}
