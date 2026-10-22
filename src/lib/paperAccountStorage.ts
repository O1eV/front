import { sampleStocks } from "../data/markets";
import { createPaperAccount, type PaperAccount } from "./paperTrading";

const storageKey = "oev.paper.demo.v1";

export function readAccount(): PaperAccount {
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

export function storeAccount(account: PaperAccount) {
  sessionStorage.setItem(storageKey, JSON.stringify(account));
}
