import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = source =>
    `data:text/javascript;base64,${Buffer.from(ts.transpile(source, { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext })).toString('base64')}`;
const source = fs.readFileSync('src/api/marketCatalog.ts', 'utf8').replace(/^import .*;\n/gm, '');
const coins = Array.from({ length: 47 }, (_, i) => ({ symbol: `KRW-${i}` }));
globalThis.catalogCalls = [];
const { getCatalogPage } = await import(
    compile(`
const demoStocks = Array.from({length:4},(_,i)=>({symbol:String(i).padStart(6,'0')}));
const getMarkets = async filters => {
 globalThis.catalogCalls.push(filters);
 return {items: ${JSON.stringify(coins)}.slice(filters.page*20,(filters.page+1)*20),totalElements:47,page:filters.page,size:20};
};
${source}`)
);
const filters = { assetClass: '', marketState: '', signal: '', page: 0 };
const signal = new AbortController().signal;
const pages = [];
for (let page = 0; page < 3; page++) pages.push(await getCatalogPage({ ...filters, page }, signal));
assert.deepEqual(
    pages.map(p => p.totalElements),
    [51, 51, 51]
);
assert.deepEqual(
    pages.map(p => p.stocks.length + p.items.length),
    [20, 20, 11]
);
const symbols = pages.flatMap(p => [...p.stocks, ...p.items].map(s => s.symbol));
assert.equal(new Set(symbols).size, 51);
assert.deepEqual(
    pages.flatMap(p => p.items),
    coins
);
const domestic = await getCatalogPage({ ...filters, assetClass: 'KR_STOCK' }, signal);
assert.equal(domestic.totalElements, 4);
assert.equal(domestic.items.length, 0);
for (const assetClass of ['COIN', 'US_STOCK'])
    assert.equal((await getCatalogPage({ ...filters, assetClass }, signal)).stocks.length, 0);
for (const filter of [{ marketState: 'UP' }, { signal: 'BUY' }])
    assert.equal((await getCatalogPage({ ...filters, ...filter }, signal)).stocks.length, 0);
console.log(
    'PASS: merged 20-row pagination, stable counts, no duplicates or missing coins, asset/state/signal filters'
);
