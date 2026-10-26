import assert from "node:assert/strict";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import ts from "typescript";
const modulePath = pathToFileURL(`${process.cwd()}/node_modules/@stomp/stompjs/esm6/index.js`).href;
const source = fs.readFileSync("src/api/realtime.ts", "utf8")
  .replace('"@stomp/stompjs"', JSON.stringify(modulePath))
  .replace("import.meta.env.VITE_WS_URL", "undefined");
const compiled = ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext });
const { parseRealtimeMessage: parse, createRealtimeClient } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
globalThis.window = { location: { href: "https://example.com/crypto" } };
const anonymous = createRealtimeClient();
assert.equal(anonymous.brokerURL, "wss://example.com/ws");
assert.deepEqual(anonymous.connectHeaders, {});
assert.equal(anonymous.heartbeatIncoming, 10000);
assert.equal(anonymous.heartbeatOutgoing, 10000);
assert.equal(anonymous.reconnectDelay, 1000);
assert.equal(anonymous.maxReconnectDelay, 30000);
assert.equal(createRealtimeClient("test-token").connectHeaders.Authorization, "Bearer test-token");
const price = { symbol: "KRW-BTC", price: 100, time: "2026-10-26T00:00:00Z" };
assert.equal(parse("/topic/prices/KRW-BTC", JSON.stringify(price)).price, 100);
assert.equal(parse("/topic/prices/KRW-ETH", JSON.stringify(price)), undefined);
assert.equal(parse("/topic/prices/KRW-BTC", JSON.stringify({ ...price, price: -1 })), undefined);
assert.equal(parse("/topic/prices/KRW-BTC", "bad"), undefined);
const signal = { symbol: "KRW-BTC", signal: "BUY", confidence: .71, generatedAt: price.time,
  probabilities: { buy: .71, hold: .21, sell: .08 } };
assert.equal(parse("/topic/signals/KRW-BTC", JSON.stringify(signal)).probabilities.buy, .71);
assert.equal(parse("/topic/signals/KRW-BTC", JSON.stringify({ ...signal, confidence: 2 })), undefined);
const alert = { type: "SIGNAL_CHANGED", symbol: "KRW-BTC", from: "HOLD", to: "BUY", confidence: .71, time: price.time };
assert.equal(parse("/user/queue/alerts", JSON.stringify(alert)).to, "BUY");
assert.equal(parse("/topic/prices/KRW-BTC", JSON.stringify(alert)), undefined);
console.log("PASS: STOMP URL·인증 헤더·10초 heartbeat·재연결 설정·시세/신호/알림 검증·잘못된 토픽 차단");
