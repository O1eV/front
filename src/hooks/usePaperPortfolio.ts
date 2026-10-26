import { useState, type FormEvent } from "react";
import { sampleStocks } from "../data/markets";
import { readAccount, storeAccount } from "../lib/paperAccountStorage";
import {
  createPaperAccount,
  createPaperOrder,
  executePaperOrder,
  INITIAL_CASH,
  type PaperAccount,
} from "../lib/paperTrading";

export function usePaperPortfolio(initialSymbol: string) {
  const [account, setAccount] = useState(readAccount);
  const [symbol, setSymbol] = useState(initialSymbol);
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [quantity, setQuantity] = useState("");
  const [feedback, setFeedback] = useState("");
  const [storageError, setStorageError] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  function saveAccount(next: PaperAccount) {
    setAccount(next);

    try {
      storeAccount(next);
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

  function selectHolding(value: string) {
    setSymbol(value);
    setSide("sell");
    setQuantity("");
    setFeedback("");
  }

  function resetAccount() {
    saveAccount(createPaperAccount());
    setFeedback("모의 계좌를 초기화했어요.");
    setQuantity("");
  }

  return {
    account,
    symbol,
    setSymbol,
    side,
    setSide,
    quantity,
    setQuantity,
    feedback,
    setFeedback,
    storageError,
    resetOpen,
    setResetOpen,
    stock,
    positions,
    valuation,
    cost,
    assets,
    profit,
    maxQuantity,
    count,
    valid,
    handleSubmit,
    selectHolding,
    resetAccount,
  };
}

export type PaperPortfolio = ReturnType<typeof usePaperPortfolio>;
