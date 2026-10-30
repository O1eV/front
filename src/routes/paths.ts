import type { Page } from '../types/market';

type LegalPage = 'privacy' | 'terms';

export const pagePaths: Record<Page | LegalPage, string> = {
    대시보드: '/',
    '관심 종목': '/watchlist',
    '신호 이력': '/signals',
    '모의 포트폴리오': '/portfolio',
    privacy: '/privacy',
    terms: '/terms',
};

export function getPageFromPath(pathname: string): Page | undefined {
    const normalizedPath = pathname.replace(/\/+$/, '') || '/';

    return (Object.keys(pagePaths) as (Page | LegalPage)[]).find(
        (page): page is Page =>
            page !== 'privacy' && page !== 'terms' && pagePaths[page] === normalizedPath
    );
}
