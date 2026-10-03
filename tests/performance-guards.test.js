import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

test('UI polish avoids document-wide rescans on every DOM mutation',()=>{
  const s=fs.readFileSync('js/ui-polish.js','utf8');
  assert.equal((s.match(/new\s+MutationObserver\s*\(/g)||[]).length,1);
  assert.equal(s.includes('polishControlScope(document)});'),false);
  assert.equal(s.includes('Accessible names for dynamically rendered filter/sort selects.'),false);
  assert.match(s,/pendingPolishRoots/);
});

test('item image decoration cannot self-trigger an endless observer loop',()=>{
  const s=fs.readFileSync('app-parts/part-007.html','utf8');
  assert.match(s,/itemRefreshSelector49/);
  assert.match(s,/mo49\?\.disconnect\(\)/);
  assert.match(s,/finally\{observe49\(\)\}/);
});

test('header and sync maintenance are scoped and batched',()=>{
  const header=fs.readFileSync('app-parts/part-006.html','utf8');
  const sync=fs.readFileSync('js/sync-v2.js','utf8');
  assert.match(header,/target\?\.closest\?\.\('\.topbar-actions'\)/);
  assert.match(sync,/function scheduleCapture\(\)/);
  assert.match(sync,/setTimeout\(\(\)=>\{captureTimer=null;if\(!applying\)capture\(\)\},140\)/);
});
