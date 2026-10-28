import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = source =>
    `data:text/javascript;base64,${Buffer.from(ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext })).toString('base64')}`;
const client = compile(
    fs
        .readFileSync('src/api/apiClient.ts', 'utf8')
        .replace('import.meta.env.VITE_API_BASE_URL', 'undefined')
);
const paper = compile(
    fs
        .readFileSync('src/api/paper.ts', 'utf8')
        .replace(/['"]\.\/apiClient['"]/, JSON.stringify(client))
);
const {
    getPaperOrders,
    getPaperPortfolio,
    placePaperOrder,
    resetPaperAccount,
    toPaperOrderHistory,
} = await import(paper);
let request;
globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(
        JSON.stringify({ data: { orders: [], pageInfo: { page: 2, size: 20, totalElements: 0 } } })
    );
};
const controller = new AbortController();
const response = await getPaperOrders('test-access', controller.signal, {
    symbol: ' krw-btc ',
    page: 2,
    size: 20,
});
assert.equal(request.url, '/api/paper/orders?page=2&size=20&symbol=KRW-BTC');
assert.equal(request.options.headers.Authorization, 'Bearer test-access');
assert.equal(request.options.credentials, 'include');
assert.equal(response.page, 2);
await getPaperOrders('test-access', controller.signal, { symbol: '', page: 0, size: 100 });
assert.equal(request.url, '/api/paper/orders?page=0&size=100');
console.log('PASS: 모의 거래 내역 인증·종목 정규화·페이지/개수 쿼리·전체 조회');

await getPaperPortfolio('test-access', controller.signal);
assert.equal(request.url, '/api/paper/portfolio');
await placePaperOrder('test-access', 'KRW-BTC', 'BUY', 0.01);
assert.equal(request.url, '/api/paper/orders');
assert.equal(request.options.method, 'POST');
assert.deepEqual(JSON.parse(request.options.body), {
    symbol: 'KRW-BTC',
    side: 'BUY',
    orderType: 'MARKET',
    quantity: 0.01,
});
assert.equal('price' in JSON.parse(request.options.body), false);
console.log('PASS: 모의 포트폴리오 조회·시장가 주문 요청·클라이언트 체결가 미전달');

globalThis.fetch = async (url, options) => {
    request = { url, options };
    return new Response(JSON.stringify({ data: { cashBalance: 10000000 } }));
};
const reset = await resetPaperAccount('test-access');
assert.equal(request.url, '/api/paper/reset');
assert.equal(request.options.method, 'POST');
assert.equal(request.options.headers.Authorization, 'Bearer test-access');
assert.equal(request.options.body, undefined);
assert.deepEqual(reset, { cashBalance: 10000000 });
console.log('PASS: 모의 계좌 초기화 인증·본문 없는 POST·cashBalance 응답');

const pageInfo = { page: 0, size: 20, totalElements: 1 };
const order = {
    orderId: 1,
    symbol: 'KRW-BTC',
    side: 'BUY',
    quantity: 0.01,
    price: 100,
    orderedAt: '2026-10-28T01:00:00Z',
};
assert.equal(toPaperOrderHistory({ orders: [], pageInfo }).items.length, 0);
const result = toPaperOrderHistory({ orders: [order], pageInfo });
assert.equal(result.items[0].executedAt, order.orderedAt);
assert.equal(result.totalElements, 1);
assert.equal(result.items[0].fee, null);
assert.equal(result.items[0].signalAtOrder, null);
for (const patch of [
    { orderId: undefined },
    { orderId: 1.5 },
    { orderId: 0 },
    { side: 'INVALID' },
    { orderedAt: 0 },
    { orderedAt: 'invalid' },
    { quantity: '1' },
    { price: NaN },
])
    assert.throws(() => toPaperOrderHistory({ orders: [{ ...order, ...patch }], pageInfo }));
for (const invalid of [
    null,
    {},
    { orders: null, pageInfo },
    { orders: [], pageInfo: { ...pageInfo, size: 0 } },
]) {
    assert.throws(() => toPaperOrderHistory(invalid));
}
console.log('PASS: paper history conversion and invalid response rejection');
