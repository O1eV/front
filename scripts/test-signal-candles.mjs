import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
async function load(file) {
 const source=fs.readFileSync(file,'utf8').replace(/^import .*;\n/gm,'');
 const compiled=ts.transpile(source,{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext});
 return import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
}
const {mapCandles}=await load('src/api/coinChart.ts');
const first={time:'2026-10-26T00:00:00Z',open:100,high:110,low:90,close:105,volume:10};
const second={...first,time:'2026-10-26T00:01:00Z',close:108};
const candles=mapCandles([second,first,first]);
assert.equal(candles.length,2);
assert.ok(candles[0].timestamp<candles[1].timestamp);
assert.equal(candles[1].close,108);
assert.throws(()=>mapCandles([{...first,low:106}]));
assert.throws(()=>mapCandles([{...first,volume:-1}]));
assert.throws(()=>mapCandles([{...first,time:'bad'}]));
const {validateSignal}=await load('src/api/signals.ts');
const signal={symbol:'KRW-BTC',signal:'BUY',buyProbability:.71,holdProbability:.21,sellProbability:.08,confidence:.71,generatedAt:first.time};
assert.equal(validateSignal(signal,'KRW-BTC').signal,'BUY');
assert.throws(()=>validateSignal({...signal,buyProbability:.9},'KRW-BTC'));
assert.throws(()=>validateSignal(signal,'KRW-ETH'));
assert.throws(()=>validateSignal({...signal,confidence:2},'KRW-BTC'));
console.log('PASS: 캔들 시각 정렬·중복 제거·OHLCV 검증, 신호 확률 합·종목·확신도 검증');
