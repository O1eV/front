import { Link, useSearchParams } from "react-router-dom";
import "../styles/navigation-flow.css";
import { useState } from "react";
import { sampleStocks } from "../data/markets";
import "../styles/trading.css";

const signals = ["매수", "관망", "매도"] as const;
// 화면 검토용 고정 샘플. 실제 모델 결과로 사용하지 않습니다.

function createHistory(now: number) {
  const today = new Date(now);

  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 36 }, (_, index) => {
    const stock = sampleStocks[index % sampleStocks.length];

    return {
      id: index,
      stock,
      signal: signals[index % 3],
      previous: signals[(index + 1) % 3],
      timestamp: today.getTime() - index * 12 * 60 * 60 * 1000,
    };
  });
}

export function SignalHistoryPage() {
  const [anchor] = useState(Date.now);
  const [rows] = useState(() => createHistory(anchor));
  const [params, setParams] = useSearchParams();
  const requestedSymbol = params.get("symbol") ?? "";
  const symbol = sampleStocks.some(stock => stock.symbol === requestedSymbol)
    ? requestedSymbol
    : "";
  function setSymbol(value: string) {
    setParams(previous => {
      if (value) previous.set("symbol", value);
      else previous.delete("symbol");
      return previous;
    });
  }
  const [days, setDays] = useState(7);
  const [signal, setSignal] = useState("");
  const [query, setQuery] = useState("");
  const filtered = rows.filter(
    row =>
      (!symbol || row.stock.symbol === symbol) &&
      (!signal || row.signal === signal) &&
      row.timestamp >= anchor - days * 86400000 &&
      `${row.stock.name} ${row.stock.symbol}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <section className="panel trading-panel">
      <div className="section-heading">
        <div>
          <h2>
            신호 변화 내역 <span className="heading-count">{filtered.length}건</span>
          </h2>

          <p>종목과 기간을 선택해 시간에 따른 판단 변화를 확인하세요.</p>
        </div>

        <span className="pill">샘플 이력</span>
      </div>

      <div className="trading-filters">
        <label>
          종목
          <select value={symbol} onChange={event => setSymbol(event.target.value)}>
            <option value="">전체 종목</option>

            {sampleStocks.map(stock => (
              <option key={stock.symbol} value={stock.symbol}>
                {stock.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          조회 기간
          <select value={days} onChange={event => setDays(Number(event.target.value))}>
            <option value={1}>최근 24시간</option>
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
          </select>
        </label>

        <label>
          변경된 신호
          <select value={signal} onChange={event => setSignal(event.target.value)}>
            <option value="">전체 신호</option>

            {signals.map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>

        <label>
          종목 검색
          <input
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="종목명 또는 코드"
          />
        </label>
      </div>

      <div className="table-scroll">
        <table>
          <caption className="sr-only">발생 시각 내림차순 신호 변화 내역</caption>

          <thead>
            <tr>
              <th scope="col">발생 시각 (한국 시간)</th>
              <th scope="col">종목</th>
              <th scope="col">이전 신호</th>
              <th scope="col">변경된 신호</th>
              <th scope="col">종목 확인</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(row => (
              <tr key={row.id}>
                <td>
                  {new Date(row.timestamp).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
                </td>

                <td>
                  <Link className="flow-link" to={`/?symbol=${row.stock.symbol}`}>
                    {row.stock.name} <small>{row.stock.symbol}</small>
                  </Link>
                </td>

                <td>{row.previous}</td>

                <td>
                  <span className="signal-pill">{row.signal}</span>
                </td>
                <td>
                  <div className="history-actions">
                    <Link to={`/?symbol=${row.stock.symbol}`}>차트 보기</Link>
                    <Link to={`/portfolio?symbol=${row.stock.symbol}#paper-order`}>모의 주문</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="no-results" role="status">
          조건에 맞는 신호 이력이 없어요. 조회 조건을 변경해주세요.
        </div>
      )}

      <div className="table-footer">최신순 · 화면 확인용 샘플이며 실제 AI 신호가 아닙니다.</div>
    </section>
  );
}
