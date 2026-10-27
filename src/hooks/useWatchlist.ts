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
        items?: WatchlistItem[];
        error?: string;
    }>();
    const [pending, setPending] = useState<string[]>([]);
    const locks = useRef(new Set<string>());
    const revision = useRef(0);
    const currentUser = useRef(userId);
    useEffect(() => {
        currentUser.current = userId;
        revision.current += 1;
    }, [userId]);

    useEffect(() => {
        if (!token || !userId) return;
        const controller = new AbortController();
        let loading = false;
        async function load() {
            if (loading || locks.current.size > 0) return;
            loading = true;
            const startedAtRevision = revision.current;
            try {
                const data = await getWatchlist(token!, controller.signal);
                if (!controller.signal.aborted && startedAtRevision === revision.current)
                    setResult({ userId: userId!, items: data.items });
            } catch (error) {
                if (!controller.signal.aborted && startedAtRevision === revision.current)
                    setResult(previous => ({
                        userId: userId!,
                        items: previous?.userId === userId ? previous?.items : undefined,
                        error:
                            error instanceof Error
                                ? error.message
                                : '관심 종목을 불러오지 못했어요.',
                    }));
            } finally {
                loading = false;
            }
        }
        void load();
        const timer = window.setInterval(() => void load(), 20_000);
        return () => {
            controller.abort();
            window.clearInterval(timer);
        };
    }, [token, userId, retry]);

    const current = userId && result?.userId === userId ? result : undefined;
    const favoriteSymbols = current?.items?.map(item => item.symbol) ?? [];
    async function toggleFavorite(symbol: string) {
        if (!token || !userId) {
            notify('로그인 후 관심 종목을 관리할 수 있어요.');
            return;
        }
        if (!['KRW-BTC', 'KRW-ETH', 'KRW-XRP'].includes(symbol)) {
            notify(
                '현재 관심 종목은 지원 코인 3종에서 등록할 수 있어요. 종목 둘러보기를 이용해주세요.'
            );
            return;
        }
        if (!current?.items) {
            notify('관심 목록을 불러온 뒤 다시 시도해주세요.');
            return;
        }
        const lock = `${userId}:${symbol}`;
        if (locks.current.has(lock)) return;
        locks.current.add(lock);
        revision.current += 1;
        setPending(previous => [...previous, lock]);
        const removing = favoriteSymbols.includes(symbol);
        try {
            let addedAt: string | undefined;
            try {
                if (removing) await removeWatchlist(symbol, token);
                else addedAt = (await addWatchlist(symbol, token)).addedAt;
            } catch (error) {
                if (!(error instanceof ApiError)) throw error;
                if (removing && error.code === 'WATCHLIST_NOT_FOUND') {
                    // 다른 탭에서 이미 삭제한 경우 최종 상태는 동일하다.
                } else if (
                    !removing &&
                    (error.code === 'WATCHLIST_CONFLICT' ||
                        error.code === 'WATCHLIST_ALREADY_EXISTS')
                ) {
                    // 개수 초과와 중복이 같은 코드이므로 서버 목록으로 구분한다.
                    const data = await getWatchlist(token);
                    const existing = data.items.find(item => item.symbol === symbol);
                    if (!existing) throw error;
                    addedAt = existing.addedAt;
                } else throw error;
            }
            if (currentUser.current !== userId) return;
            setResult(previous =>
                previous?.userId === userId
                    ? {
                          userId,
                          items: removing
                              ? previous.items?.filter(item => item.symbol !== symbol)
                              : previous.items?.some(item => item.symbol === symbol)
                                ? previous.items
                                : [
                                      ...(previous.items ?? []),
                                      {
                                          symbol,
                                          addedAt: addedAt!,
                                          koreanName: symbol,
                                          price: null,
                                          signal: null,
                                          confidence: null,
                                      },
                                  ],
                      }
                    : previous
            );
            notify(removing ? '관심 종목에서 삭제했어요.' : '관심 종목에 등록했어요.');
        } catch (error) {
            if (currentUser.current === userId)
                notify(error instanceof Error ? error.message : '관심 종목 변경에 실패했어요.');
        } finally {
            revision.current += 1;
            locks.current.delete(lock);
            setPending(previous => previous.filter(value => value !== lock));
            setRetry(value => value + 1);
        }
    }
    return {
        favoriteSymbols,
        isWatchlistPending: (symbol: string) => pending.includes(`${userId}:${symbol}`),
        toggleFavorite,
        watchlistMarkets: current?.items ?? [],
        watchlistLoading: !!userId && !current,
        watchlistError: current?.error,
        watchlistLoggedIn: !!userId,
        reloadWatchlist: () => setRetry(value => value + 1),
    };
}
