import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { PageIntro } from './components/layout/PageIntro';
import { WatchlistRail } from './components/market/WatchlistRail';
import { Footer } from './components/layout/Footer';
import { Toast } from './components/ui/Toast';
import { useDashboard } from './hooks/useDashboard';
import { getPageFromPath } from './routes/paths';
import './App.css';

export default function App() {
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
                <Toast
                    toastMessage={dashboard.toastMessage}
                    setToastMessage={dashboard.setToastMessage}
                />
            )}
        </div>
    );
}
