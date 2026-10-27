import type { Page } from '../types/market';

export const pagePaths: Record<Page, string> = {
    대시보드: '/',
    '관심 종목': '/watchlist',
    '신호 이력': '/signals',
    '모의 포트폴리오': '/portfolio',
};

export function getPageFromPath(pathname: string): Page | undefined {
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';

    return (Object.keys(pagePaths) as Page[]).find(page => pagePaths[page] === normalizedPath);
}
