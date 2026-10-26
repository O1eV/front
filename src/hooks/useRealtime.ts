import { useEffect, useState } from "react";
import {
  createRealtimeClient,
  parseRealtimeMessage,
  type PriceEvent,
  type SignalEvent,
  type AlertEvent,
} from "../api/realtime";
import { refreshAccessToken, useAuthSession } from "../lib/auth";

interface Snapshot {
  key: string;
  status: "connecting" | "connected" | "disconnected" | "error";
  error?: string;
  price?: PriceEvent;
  signal?: SignalEvent;
  alerts: AlertEvent[];
}

export function useRealtime(symbol: string, enabled: boolean) {
  const session = useAuthSession();
  const token = session?.accessToken;
  const key = JSON.stringify([symbol, token, enabled]);
  const [snapshot, setSnapshot] = useState<Snapshot>();
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    const client = createRealtimeClient(token);
    function update(change: Partial<Snapshot>) {
      if (active)
        setSnapshot(previous => ({
          ...(previous?.key === key
            ? previous
            : { key, status: "connecting" as const, alerts: [] }),
          ...change,
        }));
    }
    client.onConnect = () => {
      update({ status: "connected", error: undefined, price: undefined, signal: undefined });
      const destinations = [`/topic/prices/${symbol}`];
      if (token) destinations.push(`/topic/signals/${symbol}`, "/user/queue/alerts");
      for (const destination of destinations)
        client.subscribe(destination, frame => {
          if (!active) return;
          const event = parseRealtimeMessage(destination, frame.body);
          if (!event) return;
          if (event.type === "PRICE")
            setSnapshot(previous => {
              if (
                previous?.key !== key ||
                (previous.price && Date.parse(previous.price.time) > Date.parse(event.time))
              )
                return previous;
              return { ...previous, price: event };
            });
          else if (event.type === "SIGNAL")
            setSnapshot(previous => {
              if (
                previous?.key !== key ||
                (previous.signal &&
                  Date.parse(previous.signal.generatedAt) > Date.parse(event.generatedAt))
              )
                return previous;
              return { ...previous, signal: event };
            });
          else
            setSnapshot(previous => {
              if (
                previous?.key !== key ||
                previous.alerts.some(
                  alert =>
                    alert.symbol === event.symbol &&
                    alert.time === event.time &&
                    alert.to === event.to
                )
              )
                return previous;
              return { ...previous, alerts: [event, ...previous.alerts].slice(0, 20) };
            });
        });
    };
    client.onWebSocketClose = () =>
      update({ status: "disconnected", price: undefined, signal: undefined });
    client.onStompError = frame => {
      const code = frame.headers.message ?? "연결 오류";
      update({ status: "error", error: code, price: undefined, signal: undefined });
      if (code.includes("TOKEN_EXPIRED") && token) {
        void client.deactivate();
        void refreshAccessToken();
      } else if (
        ["UNAUTHORIZED", "FORBIDDEN", "MARKET_NOT_FOUND", "INVALID_REQUEST"].some(value =>
          code.includes(value)
        )
      ) {
        void client.deactivate();
      }
    };
    client.activate();
    return () => {
      active = false;
      void client.deactivate();
    };
  }, [symbol, token, enabled, key]);
  return snapshot?.key === key ? snapshot : undefined;
}
