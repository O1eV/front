import { formatNumber } from "../../utils/format";
import type { PaperPortfolio } from "../../hooks/usePaperPortfolio";
import { sampleStocks } from "../../data/markets";

export function OrderHistory({ account }: Pick<PaperPortfolio, "account">) {
  return (
    <section className="panel trading-panel">
      <div className="section-heading">
        <div>
          <h2>
            체결 내역 <span className="heading-count">{account.orders.length}건</span>
          </h2>

          <p>모의 주문 체결 내역을 최신순으로 확인하세요.</p>
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
                  {new Date(order.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                </td>

                <td>{sampleStocks.find(item => item.symbol === order.symbol)?.name}</td>
                <td>{order.side === "buy" ? "매수" : "매도"}</td>
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
