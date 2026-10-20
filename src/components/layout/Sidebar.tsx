import { Link, NavLink } from 'react-router-dom';
import { pagePaths } from '../../routes/paths';

const navigation = [
    { page: '대시보드', label: '마켓' },
    { page: '관심 종목', label: '관심 종목' },
    { page: '신호 이력', label: '신호 이력' },
    { page: '모의 포트폴리오', label: '모의투자' },
] as const;

export function Sidebar() {
    return (
        <header className="sidebar">
            <Link className="brand" to="/" aria-label="OeV 홈">
                <img src="/favicon.svg?v=3" alt="" width="36" height="36" />
            </Link>
            <nav aria-label="주 메뉴">
                {navigation.map(item => (
                    <NavLink
                        key={item.page}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                        to={pagePaths[item.page]}
                        end={item.page === '대시보드'}
                    >
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </header>
    );
}
