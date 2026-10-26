import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compile = source => `data:text/javascript;base64,${Buffer.from(ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext})).toString('base64')}`;
let slots=[], cursor=0, effects=[], output;
const same=(a,b)=>a && b && a.length===b.length && a.every((x,i)=>Object.is(x,b[i]));
globalThis.hooks={
 useState(initial){const i=cursor++;slots[i]??={value:initial};return [slots[i].value,value=>{slots[i].value=typeof value==='function'?value(slots[i].value):value;}];},
 useRef(initial){const i=cursor++;return slots[i]??=( {current:initial});},
 useEffect(fn,deps){const i=cursor++;if(!same(slots[i]?.deps,deps)){effects.push(()=>{slots[i]?.cleanup?.();slots[i]={deps,cleanup:fn()};});}},
};
const react=compile('export const {useState,useRef,useEffect}=globalThis.hooks;');
const client=compile(fs.readFileSync('src/api/apiClient.ts','utf8').replace('import.meta.env.VITE_API_BASE_URL','undefined'));
const api=compile(fs.readFileSync('src/api/watchlist.ts','utf8').replace('"./apiClient"',JSON.stringify(client)));
const auth=compile('export const useAuthSession=()=>globalThis.session;');
const hook=compile(fs.readFileSync('src/hooks/useWatchlist.ts','utf8').replace('"react"',JSON.stringify(react)).replace('"../api/watchlist"',JSON.stringify(api)).replace('"../lib/auth"',JSON.stringify(auth)).replace('"../api/apiClient"',JSON.stringify(client)));
const {useWatchlist}=await import(hook);
globalThis.window={setInterval:()=>1,clearInterval:()=>{}};
globalThis.session={user:{userId:'first'},accessToken:'access'};
let items=[], posts=0, conflict=false;
const item={symbol:'KRW-BTC',addedAt:'2026-10-27T00:00:00Z',koreanName:'비트코인',price:1,signal:null,confidence:null};
globalThis.fetch=async (url,options)=>{
 assert.equal(options.headers.Authorization,'Bearer access');
 if(options.method==='POST'){
  posts++;
  if(conflict)return new Response(JSON.stringify({error:'WATCHLIST_CONFLICT',message:'최대 개수 초과'}),{status:409});
  items=[item];return new Response(JSON.stringify({data:item}));
 }
 if(options.method==='DELETE'){items=[];return new Response(JSON.stringify({data:null}));}
 return new Response(JSON.stringify({data:{items}}));
};
const messages=[];
const render=()=>{cursor=0;output=useWatchlist(message=>messages.push(message));for(const effect of effects.splice(0))effect();return output;};
const flush=async()=>{await new Promise(resolve=>setImmediate(resolve));render();};
render();await flush();assert.deepEqual(output.favoriteSymbols,[]);
const one=output.toggleFavorite('KRW-BTC');const two=output.toggleFavorite('KRW-BTC');await Promise.all([one,two]);await flush();
assert.equal(posts,1);assert.deepEqual(output.favoriteSymbols,['KRW-BTC']);
await output.toggleFavorite('KRW-BTC');await flush();assert.deepEqual(output.favoriteSymbols,[]);
conflict=true;items=[item];await output.toggleFavorite('KRW-BTC');await flush();assert.deepEqual(output.favoriteSymbols,['KRW-BTC']);
assert.equal(messages.at(-1),'관심 종목에 등록했어요.');
await output.toggleFavorite('KRW-BTC');await flush();
await output.toggleFavorite('KRW-BTC');await flush();assert.deepEqual(output.favoriteSymbols,[]);assert.equal(messages.at(-1),'최대 개수 초과');
items=[item];render();output.reloadWatchlist();render();await flush();
globalThis.session={user:{userId:'second'},accessToken:'access'};items=[];render();assert.deepEqual(output.watchlistMarkets,[]);await flush();assert.deepEqual(output.favoriteSymbols,[]);
console.log('PASS: 등록·삭제·중복 클릭 방지·다른 탭 중복 등록·개수 초과·계정 전환 목록 격리');
