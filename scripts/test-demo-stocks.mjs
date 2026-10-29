import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = source => `data:text/javascript;base64,${Buffer.from(ts.transpile(source, {target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext})).toString('base64')}`;
const client = compile(fs.readFileSync('src/api/apiClient.ts','utf8').replace('import.meta.env.VITE_API_BASE_URL','undefined'));
const candles = compile(fs.readFileSync('src/api/coinChart.ts','utf8').replace(/^import .*;\n/gm,''));
const api = compile(fs.readFileSync('src/api/demoStocks.ts','utf8').replace("'./apiClient'",JSON.stringify(client)).replace("'./coinChart'",JSON.stringify(candles)));
const {getDemoStockPrice,getDemoStockCandles} = await import(api);
const price={symbol:'005930',price:70000,tradeTimestamp:'2026-10-29T00:01:00Z',updatedAt:'2026-10-29T00:01:00Z',stale:false};
const bar={time:'2026-10-29T00:00:00Z',open:69000,high:71000,low:68000,close:70000,volume:100};
let request, mode='ok';
globalThis.fetch=async (url,options)=>{
 request={url,options};
 if(mode==='unavailable' && url.endsWith('/price')) return new Response(JSON.stringify({error:'COLLECTOR_UNAVAILABLE'}),{status:503});
 return new Response(JSON.stringify({data:url.endsWith('/price') ? (mode==='invalid' ? {...price,symbol:'KRW-BTC'}:mode==='rate' ? {...price,changeRate:-0.0125}:price) : {symbol:'005930',interval:'1m',candles:mode==='empty'?[]:[bar]}}));
};
const signal=new AbortController().signal;
assert.equal((await getDemoStockPrice('005930','fake-token',signal)).price,70000);
assert.equal(request.url,'/api/demo/stocks/005930/price');
assert.equal(request.options.headers.Authorization,'Bearer fake-token');
assert.equal((await getDemoStockCandles('005930','fake-token',signal))[0].close,70000);
assert.equal(request.url,'/api/demo/stocks/005930/candles?interval=1m&limit=300');
assert.equal(request.options.headers.Authorization,'Bearer fake-token');
await assert.rejects(getDemoStockPrice('KRW-BTC','fake-token',signal));
mode='rate'; assert.equal((await getDemoStockPrice('005930','fake-token',signal)).changeRate,-0.0125);
mode='invalid'; await assert.rejects(getDemoStockPrice('005930','fake-token',signal));
mode='empty'; assert.deepEqual(await getDemoStockCandles('005930','fake-token',signal),[]);
// 훅의 실제 비동기 흐름을 검증하되 타이머와 React 스케줄러만 대체합니다.
let slots=[],cursor=0,effects=[],timers=[];
globalThis.testHooks={
 useState(initial){const i=cursor++; slots[i]??={value:initial};return [slots[i].value,v=>{slots[i].value=typeof v==='function'?v(slots[i].value):v;}];},
 useEffect(fn,deps){const i=cursor++;if(!slots[i]||deps.some((v,j)=>v!==slots[i].deps[j])){effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}},
};
const react=compile('export const {useState,useEffect}=globalThis.testHooks;');
const hook=compile(fs.readFileSync('src/hooks/useDemoStock.ts','utf8').replace("'react'",JSON.stringify(react)).replace("'../api/apiClient'",JSON.stringify(client)).replace("'../api/demoStocks'",JSON.stringify(api)));
const {useDemoStock}=await import(hook);
const realSetTimeout=globalThis.setTimeout,realClearTimeout=globalThis.clearTimeout;
globalThis.setTimeout=(fn,ms)=>{const t={fn,ms};timers.push(t);return t;};
globalThis.clearTimeout=t=>{timers=timers.filter(item=>item!==t);};
const render=()=>{cursor=0;const result=useDemoStock('005930','fake-token');effects.splice(0).forEach(fn=>fn());return result;};
const flush=async()=>{for(let i=0;i<20;i++) await new Promise(resolve=>setImmediate(resolve));};
mode='ok';render();await flush();
assert.equal(render().price.data.price,70000);
assert.equal(timers.length,1);assert.equal(timers[0].ms,10000);
mode='unavailable';timers.shift().fn();await flush();
const partial=render();assert.match(partial.price.error,/수집 대기/);assert.equal(partial.price.data.price,70000);assert.equal(partial.candles.data.length,1);
mode='empty';timers.shift().fn();await flush();assert.deepEqual(render().candles.data,[]);
slots.filter(slot=>slot.cleanup).forEach(slot=>slot.cleanup());assert.equal(timers.length,0);
globalThis.setTimeout=realSetTimeout;globalThis.clearTimeout=realClearTimeout;
console.log('PASS: stock auth/paths, response validation, empty candles, independent price failure, 10s polling and cleanup');
