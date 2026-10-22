export type PaperOrder = {
  id: string;
  symbol: string;
  side: "buy" | "sell";
  quantity: number;
  price: number;
  timestamp: number;
};

export type Holding = { symbol: string; quantity: number; averagePrice: number };

export type PaperAccount = { cash: number; holdings: Holding[]; orders: PaperOrder[] };

export const INITIAL_CASH = 10_000_000;

export function createPaperAccount(): PaperAccount {
  return { cash: INITIAL_CASH, holdings: [], orders: [] };
}

export function executePaperOrder(account: PaperAccount, order: PaperOrder): PaperAccount {
  if (
    !Number.isSafeInteger(order.quantity) ||
    order.quantity <= 0 ||
    !Number.isFinite(order.price) ||
    order.price <= 0
  )
    throw new Error("수량은 1주 이상의 정수로 입력해주세요.");

  const total = order.price * order.quantity;

  if (!Number.isSafeInteger(total)) throw new Error("주문 금액을 확인해주세요.");

  const holding = account.holdings.find(item => item.symbol === order.symbol);

  if (order.side === "buy" && total > account.cash) throw new Error("주문 가능 금액이 부족해요.");

  if (order.side === "sell" && order.quantity > (holding?.quantity ?? 0))
    throw new Error("보유 수량보다 많이 매도할 수 없어요.");

  const quantity =
    (holding?.quantity ?? 0) + (order.side === "buy" ? order.quantity : -order.quantity);

  const averagePrice =
    order.side === "buy"
      ? ((holding?.averagePrice ?? 0) * (holding?.quantity ?? 0) + total) / quantity
      : holding!.averagePrice;

  return {
    cash: account.cash + (order.side === "buy" ? -total : total),
    holdings: [
      ...account.holdings.filter(item => item.symbol !== order.symbol),
      ...(quantity ? [{ symbol: order.symbol, quantity, averagePrice }] : []),
    ],
    orders: [order, ...account.orders],
  };
}

export function createPaperOrder(values: Omit<PaperOrder, "id" | "timestamp">): PaperOrder {
  return { ...values, id: crypto.randomUUID(), timestamp: Date.now() };
}
