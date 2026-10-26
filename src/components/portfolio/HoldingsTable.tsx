import { formatNumber } from "../../utils/format";
import type { PaperPortfolio } from "../../hooks/usePaperPortfolio";

export function HoldingsTable({
  positions,
  valuation,
  cost,
  selectHolding,
}: Pick<PaperPortfolio, "positions" | "valuation" | "cost" | "selectHolding">) {
  return (
    <section className="panel trading-panel">
      <div className="section-heading">
        <div>
          <h2>보유 종목</h2>

          <p>
            평가손익 {formatNumber(valuation - cost)}원 ·{" "}
            {cost ? (((valuation - cost) / cost) * 100).toFixed(2) : "0.00"}%
          </p>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">종목</th>
              <th scope="col">수량</th>
              <th scope="col">평균 매수가</th>
              <th scope="col">평가액</th>
              <th scope="col">평가손익 · 수익률</th>
            </tr>
          </thead>

          <tbody>
            {positions.map(item => (
              <tr key={item.symbol}>
                <td>
                  <button className="holding-link" onClick={() => selectHolding(item.symbol)}>
                    {item.stock.name}
                  </button>
                </td>

                <td>{item.quantity}주</td>
                <td>{formatNumber(Math.round(item.averagePrice))}원</td>
                <td>{formatNumber(item.stock.price * item.quantity)}원</td>

                <td>
                  {formatNumber(Math.round((item.stock.price - item.averagePrice) * item.quantity))}
                  원 · {((item.stock.price / item.averagePrice - 1) * 100).toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!positions.length && (
        <div className="no-results">아직 보유한 종목이 없어요. 첫 모의 주문을 해보세요.</div>
      )}
    </section>
  );
}
