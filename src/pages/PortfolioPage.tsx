import { useState, type FormEvent } from "react";
import { sampleStocks } from "../data/markets";
import {
  createPaperAccount,
  createPaperOrder,
  executePaperOrder,
  INITIAL_CASH,
  type PaperAccount,
} from "../lib/paperTrading";
import { formatNumber } from "../utils/format";
import "../styles/trading.css";

const storageKey = "oev.paper.demo.v1";
function readAccount(): PaperAccount {
  try {
    const account = JSON.parse(sessionStorage.getItem(storageKey) || "null");
    if (
      account &&
      Number.isFinite(account.cash) &&
      account.cash >= 0 &&
      Array.isArray(account.orders) &&
      Array.isArray(account.holdings) &&
      account.holdings.every(
        (item: { symbol: string; quantity: number; averagePrice: number }) =>
          sampleStocks.some(stock => stock.symbol === item?.symbol) &&
          Number.isSafeInteger(item.quantity) &&
          item.quantity > 0 &&
          Number.isFinite(item.averagePrice) &&
          item.averagePrice > 0
      ) &&
      account.orders.every(
        (order: {
          symbol: string;
          side: string;
          quantity: number;
          price: number;
          timestamp: number;
          id: string;
        }) =>
          sampleStocks.some(stock => stock.symbol === order?.symbol) &&
          ["buy", "sell"].includes(order.side) &&
          Number.isSafeInteger(order.quantity) &&
          order.quantity > 0 &&
          Number.isFinite(order.price) &&
          order.price > 0 &&
          Number.isFinite(order.timestamp) &&
          typeof order.id === "string"
      )
    )
      return account;
  } catch {
    /* Start a fresh demo account if storage cannot be read. */
  }
  return createPaperAccount();
}
export function PortfolioPage() {
  const [account, setAccount] = useState(readAccount);
  const [symbol, setSymbol] = useState(sampleStocks[0].symbol);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [feedback, setFeedback] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  function saveAccount(next: PaperAccount) {
    setAccount(next);
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      setStorageError(true);
    }
  }
  const stock = sampleStocks.find(item => item.symbol === symbol)!;
  const holding = account.holdings.find(item => item.symbol === symbol);
  const positions = account.holdings.map(item => ({
    ...item,
    stock: sampleStocks.find(stock => stock.symbol === item.symbol)!,
  }));
  const valuation = positions.reduce((sum, item) => sum + item.quantity * item.stock.price, 0);
  const cost = positions.reduce((sum, item) => sum + item.quantity * item.averagePrice, 0);
  const assets = account.cash + valuation;
  const profit = assets - INITIAL_CASH;
  const maxQuantity =
    side === "buy" ? Math.floor(account.cash / stock.price) : (holding?.quantity ?? 0);
  const count = Number(quantity);
  const valid = Number.isSafeInteger(count) && count > 0 && count <= maxQuantity;
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    try {
      const next = executePaperOrder(
        account,
        createPaperOrder({
          symbol,
          side,
          quantity: count,
          price: stock.price,
        })
      );
      saveAccount(next);
      setQuantity("");
      setFeedback(`${stock.name} ${count}주 ${side === "buy" ? "매수" : "매도"}가 체결됐어요.`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "주문을 확인해주세요.");
    }
  }
  return (
    <div className="trading-page">
      <div className="demo-notice">
        가상 자금 1,000만 원으로 연습해보세요. 샘플 가격으로 즉시 체결되며 수수료는 제외됩니다.
        계좌는 현재 브라우저 탭에만 저장됩니다.
      </div>
      {storageError && (
        <p role="alert">
          브라우저 저장을 사용할 수 없어 페이지를 새로고침하면 계좌가 초기화됩니다.
        </p>
      )}
      <section className="account-summary" aria-label="모의 계좌 요약">
        {[
          ["총 평가 자산", `${formatNumber(assets)}원`],
          ["주문 가능 금액", `${formatNumber(account.cash)}원`],
          ["보유 종목 평가액", `${formatNumber(valuation)}원`],
          [
            "총 수익 · 수익률",
            `${profit >= 0 ? "+" : ""}${formatNumber(profit)}원 · ${((profit / INITIAL_CASH) * 100).toFixed(2)}%`,
          ],
        ].map(([label, value]) => (
          <div className="panel summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <div className="paper-grid">
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
                      <button
                        className="holding-link"
                        onClick={() => {
                          setSymbol(item.symbol);
                          setSide("sell");
                          setQuantity("");
                          setFeedback("");
                        }}
                      >
                        {item.stock.name}
                      </button>
                    </td>
                    <td>{item.quantity}주</td>
                    <td>{formatNumber(Math.round(item.averagePrice))}원</td>
                    <td>{formatNumber(item.stock.price * item.quantity)}원</td>
                    <td>
                      {formatNumber(
                        Math.round((item.stock.price - item.averagePrice) * item.quantity)
                      )}
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
        <section className="panel order-panel">
          <h2>모의 주문</h2>
          <p className="order-description">시장가 · 샘플 현재가로 즉시 체결</p>
          <form onSubmit={handleSubmit}>
            <div className="order-sides">
              {(["buy", "sell"] as const).map(value => (
                <button
                  type="button"
                  key={value}
                  aria-pressed={side === value}
                  onClick={() => {
                    setSide(value);
                    setQuantity("");
                    setFeedback("");
                  }}
                >
                  {value === "buy" ? "매수" : "매도"}
                </button>
              ))}
            </div>
            <label>
              종목
              <select
                value={symbol}
                onChange={event => {
                  setSymbol(event.target.value);
                  setQuantity("");
                  setFeedback("");
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
                <dt>{side === "buy" ? "매수" : "매도"} 가능</dt>
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
                  setFeedback("");
                }}
                placeholder="수량을 입력하세요"
                required
                aria-describedby="quantity-hint"
              />
            </label>
            <p id="quantity-hint" className="order-description">
              {quantity && !valid
                ? "가능 수량 이내의 양의 정수를 입력해주세요."
                : "1주 단위로 주문할 수 있어요."}
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
              모의 {side === "buy" ? "매수" : "매도"}
            </button>
          </form>
          <p role="status" className="order-feedback">
            {feedback}
          </p>
        </section>
      </div>
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
      <div className="reset-account">
        {resetOpen ? (
          <>
            <p>잔고를 1,000만 원으로 되돌리고 보유 종목과 체결 내역을 지울까요?</p>
            <button
              onClick={() => {
                saveAccount(createPaperAccount());
                setResetOpen(false);
                setFeedback("모의 계좌를 초기화했어요.");
                setQuantity("");
              }}
            >
              초기화 확인
            </button>
            <button onClick={() => setResetOpen(false)}>취소</button>
          </>
        ) : (
          <button onClick={() => setResetOpen(true)}>모의 계좌 초기화</button>
        )}
      </div>
    </div>
  );
}
