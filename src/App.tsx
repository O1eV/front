import { Link, Route, Routes, useLocation } from 'react-router-dom';
import { Sidebar } from './components/layout/Sidebar';
import { PageIntro } from './components/layout/PageIntro';
import { Footer } from './components/layout/Footer';
import { getPageFromPath, pagePaths } from './routes/paths';
import './styles/layout.css';

export default function App() {
    const { pathname } = useLocation();
    const page = getPageFromPath(pathname);

    return (
        <div className="app-shell">
            <a className="skip-link" href="#main-content">
                본문으로 건너뛰기
            </a>
            <Sidebar />
            <main id="main-content" tabIndex={-1}>
                {page && <PageIntro page={page} />}
                <Routes>
                    {Object.values(pagePaths).map(path => (
                        <Route
                            key={path}
                            path={path}
                            element={
                                <section className="page-placeholder" aria-label="준비 중">
                                    <p>화면을 준비하고 있어요.</p>
                                </section>
                            }
                        />
                    ))}
                    <Route
                        path="*"
                        element={
                            <section className="page-placeholder">
                                <h1>페이지를 찾을 수 없어요.</h1>
                                <Link to="/">마켓으로 돌아가기</Link>
                            </section>
                        }
                    />
                </Routes>
                <Footer />
            </main>
        </div>
    );
}
