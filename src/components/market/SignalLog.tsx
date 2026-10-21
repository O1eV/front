import type { Stock } from "../../types/market";

export function SignalLog({ stock }: { stock: Stock }) {
  return (
    <section className="signal-log" aria-label="선택 종목 신호 이력">
      <div className="signal-log-heading">
        <h2>신호 이력</h2>
        <span>
          {stock.symbol} · {stock.exchange} · 샘플
        </span>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>시간</th>
              <th>종목</th>
              <th>판단</th>
              <th>매수</th>
              <th>관망</th>
              <th>매도</th>
            </tr>
          </thead>
          <tbody>
            {[0, 1, 2].map(index => {
              const buyProbability = stock.buyProbability - index * 3;
              const hold = Math.round((100 - buyProbability) * 0.65);
              return (
                <tr key={index}>
                  <td className="log-time">10:{String(40 - index * 5).padStart(2, "0")}:00</td>
                  <td>{stock.symbol}</td>
                  <td>
                    <span className={`signal-pill ${buyProbability > 50 ? "" : "neutral"}`}>
                      {buyProbability > 50 ? "매수 우세" : "관망 우세"}
                    </span>
                  </td>
                  <td>{buyProbability}%</td>
                  <td>{hold}%</td>
                  <td>{100 - buyProbability - hold}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
