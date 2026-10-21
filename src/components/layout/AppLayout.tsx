import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { PageIntro } from "./PageIntro";
import { WatchlistRail } from "../market/WatchlistRail";
import { Footer } from "./Footer";
import { Toast } from "../ui/Toast";
import { useDashboard } from "../../hooks/useDashboard";
import { getPageFromPath } from "../../routes/paths";

export function AppLayout() {
  const dashboard = useDashboard();
  const { pathname } = useLocation();
  const page = getPageFromPath(pathname);

  return (
    <div className="app-shell">
      <Sidebar
        favoriteSymbols={dashboard.favoriteSymbols}
        searchQuery={dashboard.searchQuery}
        setSearchQuery={dashboard.setSearchQuery}
      />

      <div className="content-layout">
        <div className="main-shell">
          <main>
            {page && <PageIntro page={page} />}
            <Outlet context={dashboard} />
            <Footer />
          </main>
        </div>

        <WatchlistRail
          favoriteSymbols={dashboard.favoriteSymbols}
          setSelectedStock={dashboard.setSelectedStock}
          toggleFavorite={dashboard.toggleFavorite}
        />
      </div>
      {dashboard.toastMessage && (
        <Toast toastMessage={dashboard.toastMessage} setToastMessage={dashboard.setToastMessage} />
      )}
    </div>
  );
}
