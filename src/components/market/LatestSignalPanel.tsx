import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/apiClient';
import { getLatestSignal, type LatestSignal } from '../../api/signals';
import { useAuthSession } from '../../lib/auth';
import { useDashboardContext } from '../../hooks/useDashboardContext';

const labels = { BUY: '매수', HOLD: '관망', SELL: '매도' };
export function LatestSignalPanel({
    symbol,
    onLatest,
}: {
    symbol: string;
    onLatest?: (signal: LatestSignal) => void;
}) {
    const session = useAuthSession();
    const token = session?.accessToken;
    const key = JSON.stringify([symbol, session?.user.userId]);
    const { realtime } = useDashboardContext();
    const event =
        realtime?.status === 'connected' && realtime.signal?.symbol === symbol
            ? realtime.signal
            : undefined;
    const [result, setResult] = useState<{ key: string; data?: LatestSignal; error?: string }>();
    const [retry, setRetry] = useState(0);
    const [now, setNow] = useState(Date.now);
    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 15000);
        return () => clearInterval(timer);
    }, []);
    useEffect(() => {
        if (!token) return;
        const controller = new AbortController();
        getLatestSignal(symbol, token, controller.signal)
            .then(data => {
                if (!controller.signal.aborted) {
                    setResult({ key, data });
                    onLatest?.(data);
                }
            })
            .catch((error: unknown) => {
                if (controller.signal.aborted) return;
                let message = error instanceof Error ? error.message : '신호 조회에 실패했어요.';
                if (error instanceof ApiError && error.code === 'SIGNAL_NOT_FOUND')
                    message = '아직 생성된 AI 신호가 없어요.';
                if (error instanceof ApiError && error.status === 429)
                    message = '조회 요청이 많아요. 잠시 후 다시 시도해주세요.';
                setResult(previous => ({
                    key,
                    data: previous?.key === key ? previous.data : undefined,
                    error: message,
                }));
            });
        return () => controller.abort();
    }, [symbol, token, key, retry, event?.generatedAt, onLatest]);
    const current = result?.key === key ? result : undefined;
    const rest = current?.data;
    const useEvent =
        event && (!rest || Date.parse(event.generatedAt) >= Date.parse(rest.generatedAt));
    const signal = useEvent ? event.signal : rest?.signal;
    const generatedAt = useEvent ? event.generatedAt : rest?.generatedAt;
    const confidence = useEvent ? event.confidence : rest?.confidence;
    const probabilities = useEvent
        ? event.probabilities
        : rest
          ? { buy: rest.buyProbability, hold: rest.holdProbability, sell: rest.sellProbability }
          : null;
    const stale =
        (useEvent ? event.stale : rest?.stale) ||
        !!current?.error ||
        (generatedAt ? now - Date.parse(generatedAt) >= 120000 : false);
    return (
        <section className="panel latest-signal-panel" aria-label="최신 AI 신호">
            <h2>최신 AI 판단</h2>
            {!session ? (
                <p>
                    <Link to="/login">로그인</Link> 후 AI 신호를 확인할 수 있어요.
                </p>
            ) : (
                <>
                    {!current && !signal && <p role="status">최신 신호를 불러오는 중…</p>}
                    {current?.error && (
                        <p role="alert">
                            {current.error}{' '}
                            <button onClick={() => setRetry(value => value + 1)}>다시 조회</button>
                        </p>
                    )}
                    {signal && (
                        <div aria-live="polite">
                            <strong>
                                {labels[signal]} · 확신도 {((confidence ?? 0) * 100).toFixed(0)}%
                            </strong>
                            {stale && (
                                <span className="signal-stale">지연됨 · 마지막 수신 신호</span>
                            )}
                            {probabilities ? (
                                <div className="probabilities">
                                    {(
                                        [
                                            ['buy', '매수'],
                                            ['hold', '관망'],
                                            ['sell', '매도'],
                                        ] as const
                                    ).map(([field, label]) => (
                                        <div className="probability" key={field}>
                                            <div className="probability-label">
                                                <span>{label}</span>
                                                <strong>
                                                    {(probabilities[field] * 100).toFixed(1)}%
                                                </strong>
                                            </div>
                                            <div className="bar-track">
                                                <div
                                                    className={field}
                                                    style={{
                                                        width: `${probabilities[field] * 100}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p>확률 분포는 아직 제공되지 않았어요.</p>
                            )}
                            <p>
                                산출 시각:{' '}
                                {generatedAt && new Date(generatedAt).toLocaleString('ko-KR')}
                            </p>
                            <p>
                                모델 버전:{' '}
                                {rest && rest.generatedAt === generatedAt
                                    ? (rest.modelVersion ?? '미제공')
                                    : '미제공'}
                            </p>
                        </div>
                    )}
                </>
            )}
            <p className="my-info-note">AI 신호는 투자 결과를 보장하지 않습니다.</p>
        </section>
    );
}
