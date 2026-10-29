import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
    getPaperPortfolio,
    placePaperOrder,
    resetPaperAccount,
    type ServerPortfolio,
} from '../../api/paper';
import { ApiError } from '../../api/apiClient';
import { coinMarkets } from '../../api/upbit';
import { useAuthSession } from '../../lib/auth';
import { useCollectedPrice } from '../../hooks/useCollectedPrice';
import { ServerOrderHistory } from './OrderHistory';

const money = (value: number) => `${value.toLocaleString('ko-KR', { maximumFractionDigits: 8 })}원`;
export function ServerPortfolioWorkspace({ initialSymbol }: { initialSymbol: string }) {
    const session = useAuthSession();
    if (!session)
        return (
            <p className="no-results">
                <Link to="/login">로그인</Link> 후 서버 모의투자를 이용할 수 있어요.
            </p>
        );
    return (
        <ServerAccount
            key={session.user.userId}
            token={session.accessToken}
            initialSymbol={initialSymbol}
        />
    );
}
function ServerAccount({ token, initialSymbol }: { token: string; initialSymbol: string }) {
    const [symbol, setSymbol] = useState(
        coinMarkets.some(item => item.symbol === initialSymbol) ? initialSymbol : 'KRW-BTC'
    );
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState('');
    const [pending, setPending] = useState(false);
    const [resetOpen, setResetOpen] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [resetFeedback, setResetFeedback] = useState('');
    const locked = useRef(false);
    const [feedback, setFeedback] = useState('');
    const [revision, setRevision] = useState(0);
    const [result, setResult] = useState<{
        data?: ServerPortfolio;
        error?: string;
        revision: number;
    }>();
    const collected = useCollectedPrice(symbol);
    const price = collected?.data && !collected.data.stale ? collected.data.price : undefined;
    useEffect(() => {
        if (resetting) return;
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout>;
        async function load() {
            try {
                const data = await getPaperPortfolio(token, controller.signal);
                if (!controller.signal.aborted) setResult({ data, revision });
            } catch (error) {
                if (!controller.signal.aborted)
                    setResult(previous => ({
                        data: previous?.data,
                        revision,
                        error:
                            error instanceof Error
                                ? error.message
                                : '포트폴리오 조회에 실패했어요.',
                    }));
            } finally {
                if (!controller.signal.aborted) timer = setTimeout(load, 20000);
            }
        }
        void load();
        return () => {
            controller.abort();
            clearTimeout(timer);
        };
    }, [token, revision, resetting]);
    const data = result?.data;
    const count = Number(quantity);
    const holding = data?.holdings.find(item => item.symbol === symbol);
    const estimate = price ? count * price : 0;
    const valid =
        !!data &&
        result?.revision === revision &&
        !result?.error &&
        !!price &&
        Number.isFinite(count) &&
        count > 0 &&
        /^\d+(\.\d{1,12})?$/.test(quantity) &&
        (side === 'BUY'
            ? estimate * 1.0005 <= data.cashBalance
            : count <= (holding?.quantity ?? 0));
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (!valid || locked.current) return;
        locked.current = true;
        setPending(true);
        setFeedback('');
        try {
            const order = await placePaperOrder(token, symbol, side, count);
            setFeedback(
                `모의 ${side === 'BUY' ? '매수' : '매도'} 체결 완료 · ${order.symbol} ${order.quantity}개 · ${money(order.price)}`
            );
            setQuantity('');
        } catch (error) {
            setFeedback(
                error instanceof ApiError
                    ? error.message
                    : '주문 결과를 확인하지 못했어요. 거래 내역을 조회한 뒤 다시 주문해주세요.'
            );
        } finally {
            setRevision(value => value + 1);
            setPending(false);
            locked.current = false;
        }
    }
    async function resetAccount() {
        if (locked.current) return;
        locked.current = true;
        setPending(true);
        setResetting(true);
        setResetFeedback('');
        // 초기화 이전에 시작한 조회가 응답을 덮어쓰지 않도록 중단합니다.
        try {
            const { cashBalance } = await resetPaperAccount(token);
            setResult({
                data: {
                    currency: 'KRW',
                    cashBalance,
                    totalAssetAmount: cashBalance,
                    totalPurchaseAmount: 0,
                    totalEvaluationAmount: 0,
                    totalProfitLoss: 0,
                    totalReturnRate: 0,
                    pricesComplete: true,
                    holdings: [],
                },
                revision: revision + 1,
            });
            setQuantity('');
            setFeedback('');
            setResetOpen(false);
            setResetFeedback('모의 계좌를 초기화했어요.');
        } catch (error) {
            setResetFeedback(
                error instanceof ApiError
                    ? error.message
                    : '초기화 결과를 확인하지 못했어요. 계좌와 거래 내역을 다시 확인해주세요.'
            );
        } finally {
            setRevision(value => value + 1);
            setPending(false);
            setResetting(false);
            locked.current = false;
        }
    }
    return (
        <div className="trading-page">
            <div className="demo-notice">
                실거래가 없는 서버 모의투자입니다. 최신 수집 시세로 체결하며 수수료는 0.05%입니다.
            </div>
            <section className="panel server-reset-panel" aria-labelledby="server-reset-title">
                <div>
                    <h2 id="server-reset-title">모의 계좌 초기화</h2>
                    <p>가상 잔고를 1,000만 원으로 되돌리고 보유 종목과 거래 내역을 삭제합니다.</p>
                </div>
                <div className="reset-account">
                    {resetOpen ? (
                        <div role="group" aria-label="모의 계좌 초기화 확인">
                            <p>삭제한 연습 기록은 복구할 수 없어요. 초기화할까요?</p>
                            <button
                                type="button"
                                disabled={pending}
                                onClick={() => void resetAccount()}
                            >
                                {resetting ? '초기화 중…' : '초기화 확인'}
                            </button>
                            <button
                                type="button"
                                disabled={pending}
                                onClick={() => setResetOpen(false)}
                            >
                                취소
                            </button>
                        </div>
                    ) : (
                        <button
                            type="button"
                            disabled={pending}
                            onClick={() => {
                                setResetOpen(true);
                                setResetFeedback('');
                            }}
                        >
                            모의 계좌 초기화
                        </button>
                    )}
                </div>
                {resetFeedback && <p role="status">{resetFeedback}</p>}
            </section>
            {!result && <p role="status">모의 포트폴리오를 불러오는 중…</p>}
            {result?.error && (
                <p role="alert">
                    {result.error}{' '}
                    <button onClick={() => setRevision(value => value + 1)}>다시 조회</button>
                </p>
            )}
            {data && (
                <>
                    {(!data.pricesComplete || data.holdings.some(item => !item.priceAvailable)) && (
                        <p className="demo-notice" role="status">
                            일부 종목의 최신 시세를 가져오지 못해 평균 매수가로 평가했습니다. 총
                            자산·평가액·평가손익·수익률에 대체 가격이 반영되어 있으며, 실제 현재
                            시세 기준 값과 다를 수 있어요.
                        </p>
                    )}
                    <section className="account-summary" aria-label="서버 모의 계좌 요약">
                        {[
                            ['총 자산', money(data.totalAssetAmount)],
                            ['주문 가능 현금', money(data.cashBalance)],
                            ['보유 종목 평가액', money(data.totalEvaluationAmount)],
                            [
                                '평가손익 · 수익률',
                                `${money(data.totalProfitLoss)} · ${data.totalReturnRate.toFixed(4)}%`,
                            ],
                        ].map(([label, value]) => (
                            <div className="panel summary-card" key={label}>
                                <span>{label}</span>
                                <strong>{value}</strong>
                            </div>
                        ))}
                    </section>
                    <div className="paper-grid">
                        <div className="paper-records">
                            <section className="panel trading-panel">
                                <div className="section-heading">
                                    <h2>서버 보유 종목</h2>
                                </div>
                                <div className="table-scroll">
                                    <table>
                                        <thead>
                                            <tr>
                                                {[
                                                    '종목',
                                                    '수량',
                                                    '평균 매수가',
                                                    '현재가',
                                                    '평가액',
                                                    '평가손익 · 수익률',
                                                ].map(label => (
                                                    <th scope="col" key={label}>
                                                        {label}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.holdings.map(item => (
                                                <tr key={item.symbol}>
                                                    <td>
                                                        <button
                                                            disabled={pending}
                                                            onClick={() => {
                                                                setSymbol(item.symbol);
                                                                setSide('SELL');
                                                                setQuantity('');
                                                            }}
                                                        >
                                                            {item.symbol}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        {item.quantity.toLocaleString('ko-KR', {
                                                            maximumFractionDigits: 12,
                                                        })}
                                                    </td>
                                                    <td>{money(item.averagePurchasePrice)}</td>
                                                    <td>
                                                        {item.priceAvailable ? (
                                                            money(item.currentPrice)
                                                        ) : (
                                                            <>
                                                                <span>시세 없음</span>
                                                                <br />
                                                                <small>
                                                                    평균 매수가{' '}
                                                                    {money(
                                                                        item.averagePurchasePrice
                                                                    )}
                                                                    로 평가
                                                                </small>
                                                            </>
                                                        )}
                                                    </td>
                                                    <td>{money(item.evaluationAmount)}</td>
                                                    <td>
                                                        {money(item.profitLoss)} ·{' '}
                                                        {item.returnRate.toFixed(4)}%
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {!data.holdings.length && (
                                    <p className="no-results">보유한 종목이 없어요.</p>
                                )}
                            </section>
                            <ServerOrderHistory token={token} revision={revision} />
                        </div>
                        <section className="panel order-panel" id="paper-order" tabIndex={-1}>
                            <h2>모의 주문</h2>
                            <p className="order-description">
                                시장가 · 최종 체결가는 서버에서 결정합니다.
                            </p>
                            <form onSubmit={submit}>
                                <fieldset disabled={pending}>
                                    <div className="order-sides">
                                        {(['BUY', 'SELL'] as const).map(value => (
                                            <button
                                                type="button"
                                                key={value}
                                                aria-pressed={side === value}
                                                onClick={() => {
                                                    setSide(value);
                                                    setQuantity('');
                                                }}
                                            >
                                                {value === 'BUY' ? '매수' : '매도'}
                                            </button>
                                        ))}
                                    </div>
                                    <label>
                                        종목
                                        <select
                                            value={symbol}
                                            onChange={event => {
                                                setSymbol(event.target.value);
                                                setQuantity('');
                                            }}
                                        >
                                            {coinMarkets.map(item => (
                                                <option key={item.symbol} value={item.symbol}>
                                                    {item.name} · {item.symbol}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <p>
                                        참고 현재가:{' '}
                                        {collected?.data
                                            ? money(collected.data.price)
                                            : '수집 시세 대기 중'}
                                        {collected?.data?.stale &&
                                            ' · 갱신 지연, 주문 계산에서 제외'}
                                    </p>
                                    <p>
                                        보유 수량:{' '}
                                        {holding?.quantity.toLocaleString('ko-KR', {
                                            maximumFractionDigits: 12,
                                        }) ?? 0}
                                    </p>
                                    <label>
                                        수량
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={quantity}
                                            onChange={event => setQuantity(event.target.value)}
                                            placeholder="예: 0.01"
                                            required
                                        />
                                    </label>
                                    <p className="order-description">
                                        최대 소수점 12자리. 잔고와 수수료·보유 수량은 서버에서 최종
                                        확인합니다.
                                    </p>
                                    <p>
                                        예상 주문 금액:{' '}
                                        {Number.isFinite(estimate) && estimate > 0
                                            ? money(estimate)
                                            : '—'}
                                    </p>
                                    <p>
                                        예상 수수료:{' '}
                                        {Number.isFinite(estimate) && estimate > 0
                                            ? money(estimate * 0.0005)
                                            : '—'}
                                    </p>
                                    <button
                                        className="order-submit"
                                        disabled={!valid || pending}
                                        type="submit"
                                    >
                                        {pending
                                            ? '주문 처리 중…'
                                            : `모의 ${side === 'BUY' ? '매수' : '매도'}`}
                                    </button>
                                </fieldset>
                            </form>
                            <p className="order-feedback" role="status">
                                {feedback}
                            </p>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}
