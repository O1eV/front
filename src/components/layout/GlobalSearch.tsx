import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { sampleStocks } from "../../data/markets";
import { coinMarkets } from "../../api/upbit";
import { Icon } from "../ui/Icon";
import "../../styles/navigation-flow.css";

const markets = [
  ...sampleStocks.map(stock => ({
    ...stock,
    href: `/?symbol=${stock.symbol}`,
    category: "국내 주식",
  })),
  ...coinMarkets.map(coin => ({
    ...coin,
    href: `/crypto?symbol=${coin.symbol}`,
    category: "코인",
  })),
];

export function GlobalSearch({
  onSelectStock,
}: {
  onSelectStock: (stock: (typeof sampleStocks)[number]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const normalized = query.trim().toLowerCase();
  const results = markets.filter(market =>
    `${market.name} ${market.symbol}`.toLowerCase().includes(normalized)
  );

  function selectMarket(symbol: string) {
    const stock = sampleStocks.find(item => item.symbol === symbol);
    if (stock) onSelectStock(stock);
    close();
  }

  function close() {
    setOpen(false);
    setQuery("");
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!normalized || !results.length) return;
    selectMarket(results[0].symbol);
    navigate(results[0].href);
  }

  return (
    <form
      className="global-search-shell"
      role="search"
      onSubmit={handleSubmit}
      onBlur={event => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={event => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <label className="global-search">
        <Icon name="search" size={18} />
        <input
          aria-label="전체 종목 검색"
          placeholder="주식·코인 이름 또는 코드 검색"
          value={query}
          autoComplete="off"
          aria-controls={open && normalized ? "global-search-results" : undefined}
          onFocus={() => setOpen(true)}
          onChange={event => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
      </label>

      {open && normalized && (
        <div className="global-search-results" id="global-search-results">
          <p role="status">검색 결과 {results.length}개</p>
          {results.map(market => (
            <Link key={market.symbol} to={market.href} onClick={() => selectMarket(market.symbol)}>
              <span>
                {market.name}
                <small>
                  {market.symbol} · {market.category}
                </small>
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
          {!results.length && <p>일치하는 종목이 없어요. 이름이나 코드를 확인해주세요.</p>}
        </div>
      )}
    </form>
  );
}
