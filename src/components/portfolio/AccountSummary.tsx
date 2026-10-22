import { formatNumber } from "../../utils/format";
import type { PaperPortfolio } from "../../hooks/usePaperPortfolio";
import { INITIAL_CASH } from "../../lib/paperTrading";

export function AccountSummary({
  assets,
  account,
  valuation,
  profit,
}: Pick<PaperPortfolio, "assets" | "account" | "valuation" | "profit">) {
  return (
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
  );
}
