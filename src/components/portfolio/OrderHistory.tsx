import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { formatNumber } from "../../utils/format";
import type { PaperPortfolio } from "../../hooks/usePaperPortfolio";
import { LocalOrderHistory } from "./LocalOrderHistory";
import { getPaperOrders, type PaperOrderHistory } from "../../api/paper";
import { useAuthSession } from "../../lib/auth";

export function OrderHistory({ account }: Pick<PaperPortfolio, "account">) {
  const [tab, setTab] = useState<"server" | "local">("server");
  const session = useAuthSession();
  return (
    <div>
      <div className="periods" role="tablist" aria-label="거래 내역 구분">
        <button
          id="server-orders-tab"
          role="tab"
          aria-selected={tab === "server"}
          aria-controls="server-orders"
          className={tab === "server" ? "chosen" : ""}
          onClick={() => setTab("server")}
        >
          서버 거래 내역
        </button>
        <button
          id="local-orders-tab"
          role="tab"
          aria-selected={tab === "local"}
          aria-controls="local-orders"
          className={tab === "local" ? "chosen" : ""}
          onClick={() => setTab("local")}
        >
          브라우저 연습 내역
        </button>
      </div>
      {tab === "server" ? (
        <div id="server-orders" role="tabpanel" aria-labelledby="server-orders-tab">
          {session ? (
            <ServerOrderHistory key={session.user.userId} token={session.accessToken} />
          ) : (
            <p className="no-results">
              <Link to="/login">로그인</Link> 후 서버 거래 내역을 조회할 수 있어요.
            </p>
          )}
        </div>
      ) : (
        <div id="local-orders" role="tabpanel" aria-labelledby="local-orders-tab">
          <LocalOrderHistory account={account} />
        </div>
      )}
    </div>
  );
}
export function ServerOrderHistory({ token, revision = 0 }: { token: string; revision?: number }) {
  const [draft, setDraft] = useState("");
  const [filters, setFilters] = useState({ symbol: "", page: 0, size: 20 });
  const [retry, setRetry] = useState(0);
  const key = JSON.stringify([token, filters, retry, revision]);
  const [result, setResult] = useState<{ key: string; data?: PaperOrderHistory; error?: string }>();
  useEffect(() => {
    const controller = new AbortController();
    getPaperOrders(token, controller.signal, filters)
      .then(data => {
        if (!controller.signal.aborted) setResult({ key, data });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setResult({
            key,
            error: error instanceof Error ? error.message : "거래 내역을 불러오지 못했어요.",
          });
      });
    return () => controller.abort();
  }, [token, filters, key]);
  const current = result?.key === key ? result : undefined;
  const data = current?.data;
  const pages = data ? Math.ceil(data.totalElements / data.size) : 0;
  function submit(event: FormEvent) {
    event.preventDefault();
    setFilters(previous => ({ ...previous, symbol: draft.trim().toUpperCase(), page: 0 }));
  }
  return (
    <section className="panel trading-panel" aria-label="서버 모의 거래 내역">
      <div className="section-heading">
        <div>
          <h2>
            모의 거래 내역 {data && <span className="heading-count">{data.totalElements}건</span>}
          </h2>
          <p>서버에 체결된 거래만 최신순으로 표시합니다.</p>
        </div>
      </div>
      <form className="order-history-filters" onSubmit={submit}>
        <label>
          종목 심볼
          <input
            value={draft}
            onChange={event => setDraft(event.target.value)}
            placeholder="전체 · 예: KRW-BTC"
            maxLength={30}
          />
        </label>
        <button type="submit">조회</button>
        <label>
          표시 개수
          <select
            value={filters.size}
            onChange={event =>
              setFilters(previous => ({ ...previous, size: Number(event.target.value), page: 0 }))
            }
          >
            {[20, 50, 100].map(size => (
              <option key={size}>{size}</option>
            ))}
          </select>
        </label>
        <button type="button" disabled={!current} onClick={() => setRetry(value => value + 1)}>
          새로고침
        </button>
      </form>
      {!current && (
        <p className="no-results" role="status">
          거래 내역을 불러오는 중…
        </p>
      )}
      {current?.error && (
        <p className="no-results" role="alert">
          {current.error} <button onClick={() => setRetry(value => value + 1)}>다시 시도</button>
        </p>
      )}
      {data && (
        <>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    "체결 시각 (한국 시간)",
                    "종목",
                    "구분",
                    "수량",
                    "체결가",
                    "수수료",
                    "당시 신호",
                  ].map(title => (
                    <th scope="col" key={title}>
                      {title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map(order => (
                  <tr key={order.orderId}>
                    <td>
                      {new Date(order.executedAt).toLocaleString("ko-KR", {
                        timeZone: "Asia/Seoul",
                      })}
                    </td>
                    <td>{order.symbol}</td>
                    <td>{order.side === "BUY" ? "매수" : "매도"}</td>
                    <td>{order.quantity.toLocaleString("ko-KR", { maximumFractionDigits: 12 })}</td>
                    <td>{formatNumber(order.price)}원</td>
                    <td>
                      {order.fee == null
                        ? "미기록"
                        : `${order.fee.toLocaleString("ko-KR", { maximumFractionDigits: 8 })}원`}
                    </td>
                    <td>
                      {order.signalAtOrder
                        ? { BUY: "매수", HOLD: "관망", SELL: "매도" }[order.signalAtOrder]
                        : "미기록"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.items.length && <p className="no-results">조건에 맞는 서버 거래 내역이 없어요.</p>}
          {pages > 1 && (
            <nav className="catalog-pagination" aria-label="거래 내역 페이지">
              <button
                disabled={filters.page === 0}
                onClick={() => setFilters(previous => ({ ...previous, page: previous.page - 1 }))}
              >
                이전
              </button>
              <span>
                {data.page + 1} / {pages}
              </span>
              <button
                disabled={filters.page + 1 >= pages}
                onClick={() => setFilters(previous => ({ ...previous, page: previous.page + 1 }))}
              >
                다음
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
