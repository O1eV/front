import { formatNumber } from '../../utils/format';
import type { PaperPortfolio } from '../../hooks/usePaperPortfolio';
import { sampleStocks } from '../../data/markets';

export function LocalOrderHistory({ account }: Pick<PaperPortfolio, 'account'>) {
    return (
        <section className="panel trading-panel">
            <div className="section-heading">
                <div>
                    <h2>
                        브라우저 연습 내역{' '}
                        <span className="heading-count">{account.orders.length}건</span>
                    </h2>

                    <p>
                        현재 브라우저 탭에서 연습한 내역입니다. 서버 거래 내역과 별도로 저장됩니다.
                    </p>
                </div>
            </div>

            <div className="table-scroll">
                <table>
                    <thead>
                        <tr>
                            <th scope="col">체결 시각 (한국 시간)</th>
                            <th scope="col">종목</th>
                            <th scope="col">구분</th>
                            <th scope="col">수량</th>
                            <th scope="col">체결가</th>
                            <th scope="col">체결 금액</th>
                        </tr>
                    </thead>

                    <tbody>
                        {account.orders.map(order => (
                            <tr key={order.id}>
                                <td>
                                    {new Date(order.timestamp).toLocaleString('ko-KR', {
                                        timeZone: 'Asia/Seoul',
                                    })}
                                </td>

                                <td>
                                    {sampleStocks.find(item => item.symbol === order.symbol)?.name}
                                </td>
                                <td>{order.side === 'buy' ? '매수' : '매도'}</td>
                                <td>{order.quantity}주</td>
                                <td>{formatNumber(order.price)}원</td>
                                <td>{formatNumber(order.price * order.quantity)}원</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {!account.orders.length && <div className="no-results">체결된 모의 주문이 없어요.</div>}
        </section>
    );
}
