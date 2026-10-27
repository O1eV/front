import { formatNumber } from '../../utils/format';
import type { PaperPortfolio } from '../../hooks/usePaperPortfolio';
import { sampleStocks } from '../../data/markets';

export function PaperOrderForm({
    symbol,
    setSymbol,
    side,
    setSide,
    quantity,
    setQuantity,
    feedback,
    setFeedback,
    stock,
    maxQuantity,
    count,
    valid,
    handleSubmit,
}: Pick<
    PaperPortfolio,
    | 'symbol'
    | 'setSymbol'
    | 'side'
    | 'setSide'
    | 'quantity'
    | 'setQuantity'
    | 'feedback'
    | 'setFeedback'
    | 'stock'
    | 'maxQuantity'
    | 'count'
    | 'valid'
    | 'handleSubmit'
>) {
    return (
        <section className="panel order-panel" id="paper-order" tabIndex={-1}>
            <h2>모의 주문</h2>
            <p className="order-description">시장가 · 샘플 현재가로 즉시 체결</p>

            <form onSubmit={handleSubmit}>
                <div className="order-sides">
                    {(['buy', 'sell'] as const).map(value => (
                        <button
                            type="button"
                            key={value}
                            aria-pressed={side === value}
                            onClick={() => {
                                setSide(value);

                                setQuantity('');

                                setFeedback('');
                            }}
                        >
                            {value === 'buy' ? '매수' : '매도'}
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

                            setFeedback('');
                        }}
                    >
                        {sampleStocks.map(item => (
                            <option key={item.symbol} value={item.symbol}>
                                {item.name} · {item.symbol}
                            </option>
                        ))}
                    </select>
                </label>

                <dl className="order-details">
                    <div>
                        <dt>체결 기준가</dt>
                        <dd>{formatNumber(stock.price)}원</dd>
                    </div>

                    <div>
                        <dt>{side === 'buy' ? '매수' : '매도'} 가능</dt>
                        <dd>{formatNumber(maxQuantity)}주</dd>
                    </div>
                </dl>

                <label>
                    주문 수량
                    <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantity}
                        onChange={event => {
                            setQuantity(event.target.value);

                            setFeedback('');
                        }}
                        placeholder="수량을 입력하세요"
                        required
                        aria-describedby="quantity-hint"
                    />
                </label>

                <p id="quantity-hint" className="order-description">
                    {quantity && !valid
                        ? '가능 수량 이내의 양의 정수를 입력해주세요.'
                        : '1주 단위로 주문할 수 있어요.'}
                </p>

                <button
                    className="max-button"
                    type="button"
                    disabled={!maxQuantity}
                    onClick={() => setQuantity(String(maxQuantity))}
                >
                    가능 수량 전체
                </button>

                <dl className="order-details">
                    <div>
                        <dt>예상 주문 금액</dt>
                        <dd>{formatNumber(valid ? stock.price * count : 0)}원</dd>
                    </div>
                </dl>

                <button className="order-submit" disabled={!valid} type="submit">
                    모의 {side === 'buy' ? '매수' : '매도'}
                </button>
            </form>

            <p role="status" className="order-feedback">
                {feedback}
            </p>
        </section>
    );
}
