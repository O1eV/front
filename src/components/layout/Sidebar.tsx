import { Link, NavLink } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { pagePaths } from '../../routes/paths';
import type { Page } from '../../types/market';
interface SidebarProps {
    favoriteSymbols: string[];
    searchQuery: string;
    setSearchQuery: (searchQuery: string) => void;
}
const navigation: { page: Page; label: string }[] = [
    { page: '대시보드', label: '마켓' },
    { page: '관심 종목', label: '관심 종목' },
    { page: '신호 이력', label: '신호 이력' },
    { page: '모의 포트폴리오', label: '모의투자' },
];
export function Sidebar({ favoriteSymbols, searchQuery, setSearchQuery }: SidebarProps) {
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
                        {item.page === '관심 종목' && (
                            <span className="count">{favoriteSymbols.length}</span>
                        )}
                    </NavLink>
                ))}
            </nav>
            <label className="global-search">
                <Icon name="search" size={18} />
                <input
                    aria-label="전체 종목 검색"
                    placeholder="종목을 검색하세요"
                    value={searchQuery}
                    onChange={event => setSearchQuery(event.target.value)}
                />
            </label>
            <div className="avatar" aria-label="동현 프로필">
                D
            </div>
        </header>
    );
}
