import { useEffect, useRef, useState } from 'react';
import { addWatchlist, getWatchlist, removeWatchlist, type WatchlistItem } from '../api/watchlist';
import { useAuthSession } from '../lib/auth';
import { ApiError } from '../api/apiClient';

export function useWatchlist(notify: (message: string) => void) {
    const session = useAuthSession();
    const userId = session?.user.userId;
    const token = session?.accessToken;
    const [retry, setRetry] = useState(0);
    const [result, setResult] = useState<{
        userId: string;
        symbols?: string[];
        error?: string;
    }>();
    const [markets, setMarkets] = useState<WatchlistItem[]>([]);
    const [pending, setPending] = useState<string[]>([]);
    const locks = useRef(new Set<string>());
    const revision = useRef(0);
    const currentUser = useRef(userId);
    useEffect(() => {
        currentUser.current = userId;
    }, [userId]);

    useEffect(() => {
        if (!token || !userId) return;
        const controller = new AbortController();
        const startedAtRevision = revision.current;
        getWatchlist(token, controller.signal)
            .then(data => {
                if (!controller.signal.aborted && startedAtRevision === revision.current) {
                    setResult({ userId, symbols: data.items.map(item => item.symbol) });
                    setMarkets(data.items);
                }
            })
            .catch((error: unknown) => {
                if (!controller.signal.aborted && startedAtRevision === revision.current)
                    setResult({
                        userId,
                        error:
                            error instanceof Error
                                ? error.message
                                : '관심 종목을 불러오지 못했어요.',
                    });
            });
        return () => controller.abort();
    }, [token, userId, retry]);

    const current = userId && result?.userId === userId ? result : undefined;
    const favoriteSymbols = current?.symbols ?? [];
    async function toggleFavorite(symbol: string) {
        if (!token || !userId) {
            notify('로그인 후 관심 종목을 관리할 수 있어요.');
            return;
        }
        if (!symbol.startsWith('KRW-')) {
            notify(
                '현재 관심 종목은 지원 코인 3종에서 등록할 수 있어요. 종목 둘러보기를 이용해주세요.'
            );
            return;
        }
        if (!current?.symbols) {
            notify('관심 목록을 불러온 뒤 다시 시도해주세요.');
            return;
        }
        const lock = `${userId}:${symbol}`;
        if (locks.current.has(lock)) return;
        locks.current.add(lock);
        setPending(previous => [...previous, lock]);
        const removing = favoriteSymbols.includes(symbol);
        try {
            try {
                if (removing) await removeWatchlist(symbol, token);
                else await addWatchlist(symbol, token);
            } catch (error) {
                // 다른 탭에서 먼저 처리했어도 서버의 최종 상태에 맞춘다.
                if (
                    !(error instanceof ApiError) ||
                    !(removing
                        ? error.code === 'WATCHLIST_NOT_FOUND'
                        : error.code === 'WATCHLIST_ALREADY_EXISTS')
                )
                    throw error;
            }
            if (currentUser.current !== userId) return;
            revision.current += 1;
            setResult(previous =>
                previous?.userId === userId
                    ? {
                          userId,
                          symbols: removing
                              ? previous.symbols?.filter(value => value !== symbol)
                              : [...new Set([...(previous.symbols ?? []), symbol])],
                      }
                    : previous
            );
            notify(removing ? '관심 종목에서 삭제했어요.' : '관심 종목에 등록했어요.');
        } catch (error) {
            if (currentUser.current === userId)
                notify(error instanceof Error ? error.message : '관심 종목 변경에 실패했어요.');
        } finally {
            locks.current.delete(lock);
            setRetry(value => value + 1);
            setPending(previous => previous.filter(value => value !== lock));
        }
    }
    return {
        favoriteSymbols,
        isWatchlistPending: (symbol: string) => pending.includes(`${userId}:${symbol}`),
        toggleFavorite,
        watchlistMarkets: markets,
        watchlistLoading: !!userId && !current,
        watchlistError: current?.error,
        watchlistLoggedIn: !!userId,
        reloadWatchlist: () => setRetry(value => value + 1),
    };
}
