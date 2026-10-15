import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const qa=fs.readFileSync('scripts/phase7-browser-qa.mjs','utf8');
const index=fs.readFileSync('index.html','utf8');

test('Phase 08 warm-loader QA waits for all actual UX bridges before timing',()=>{
 for(const name of ['OmniNav02','OmniToday03','OmniModules07','OmniLife06','OmniCalendar05'])
   assert.ok(qa.includes('!!window.'+name),'Startup readiness missing '+name);
 assert.match(qa,/async function loaderMetric\(kind\)/);
 assert.match(qa,/requestAnimationFrame\(\(\)=>requestAnimationFrame\(done\)\)/);
 assert.match(qa,/await setViewport\(390,844\)/);
 assert.match(qa,/async function reloadFreshDocument08\(\)/);
 assert.match(qa,/window\.__omniosQAOldDocument/);
 assert.match(qa,/Page\.reload/);
 assert.match(qa,/report\.startup08=\{cold:cold08,warm:warm08,warmRuns,warmMedianMs\}/);
});

test('Phase 08 startup keeps exact checksum validation and atomic release loader',()=>{
 assert.match(index,/async function verified\(m,text\)/);
 assert.match(index,/crypto\.subtle\.digest\('SHA-256',bytes\)/);
 assert.match(index,/const saved=await installed\(\)\.catch\(\(\)=>null\)/);
 assert.match(index,/const loaded=saved\|\|await fetchLatest\(\{activate:true\}\)/);
 assert.doesNotMatch(qa,/localStorage\.clear\(|caches\.delete\(/);
});
