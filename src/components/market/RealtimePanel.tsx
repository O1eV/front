import { Link } from 'react-router-dom';
import { useDashboardContext } from '../../hooks/useDashboardContext';
import { useAuthSession } from '../../lib/auth';
import { formatNumber } from '../../utils/format';
import '../../styles/realtime.css';

const names = { BUY: '매수', HOLD: '관망', SELL: '매도' };
export function RealtimePanel() {
    const { realtime } = useDashboardContext();
    const session = useAuthSession();
    const signal = realtime?.signal;
    return (
        <section className="realtime-panel" aria-label="실시간 시세·신호">
            <p role="status">
                {realtime?.status === 'connected'
                    ? '실시간 연결됨'
                    : realtime?.status === 'error'
                      ? `실시간 연결 오류: ${realtime.error}`
                      : realtime?.status === 'disconnected'
                        ? '실시간 연결이 끊겼어요. 재연결 중…'
                        : '실시간 연결 중…'}
                {realtime?.price && (
                    <>
                        {' '}
                        · {realtime.price.symbol} {formatNumber(realtime.price.price)}원{' '}
                        <small>{new Date(realtime.price.time).toLocaleTimeString('ko-KR')}</small>
                    </>
                )}
            </p>
            {!session ? (
                <p>
                    <Link to="/login">로그인</Link> 후 AI 신호와 관심 종목 알림을 받을 수 있어요.
                </p>
            ) : signal ? (
                <div className="realtime-signal" aria-live="polite">
                    <strong>
                        {signal.symbol} · {names[signal.signal]} · 확신도{' '}
                        {(signal.confidence * 100).toFixed(0)}%
                    </strong>
                    {signal.stale && <span>이전 신호 · 모델 갱신 지연</span>}
                    {signal.probabilities && (
                        <p>
                            매수 {(signal.probabilities.buy * 100).toFixed(0)}% · 관망{' '}
                            {(signal.probabilities.hold * 100).toFixed(0)}% · 매도{' '}
                            {(signal.probabilities.sell * 100).toFixed(0)}%
                        </p>
                    )}
                    <small>{new Date(signal.generatedAt).toLocaleString('ko-KR')}</small>
                </div>
            ) : (
                <p>신호 구독 중 · 아직 수신된 AI 신호가 없어요.</p>
            )}
            {realtime?.alerts.length ? (
                <div className="realtime-alerts" aria-live="polite">
                    <h3>관심 종목 신호 알림</h3>
                    {realtime.alerts.slice(0, 5).map(alert => (
                        <p key={`${alert.symbol}:${alert.time}:${alert.to}`}>
                            {alert.symbol} · {names[alert.from]} → {names[alert.to]} ·{' '}
                            {new Date(alert.time).toLocaleTimeString('ko-KR')}
                        </p>
                    ))}
                </div>
            ) : null}
        </section>
    );
}
