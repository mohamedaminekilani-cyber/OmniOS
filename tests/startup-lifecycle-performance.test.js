import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

test('startup has one DOM-ready coordinator and page-scoped observer lifecycle',()=>{
  const s=fs.readFileSync('app-parts/part-001.html','utf8');
  assert.match(s,/omnios-performance-runtime-v100/);
  assert.match(s,/readyQueue100/);
  assert.match(s,/nativeDocumentAdd100\.call\(document,'DOMContentLoaded',flushReady100/);
  assert.match(s,/class ManagedMutationObserver100/);
  assert.match(s,/pagePool100/);
  assert.match(s,/window\.MutationObserver=ManagedMutationObserver100/);
});

test('mobile overlays avoid GPU-heavy backdrop blur',()=>{
  const s=fs.readFileSync('app-parts/part-001.html','utf8');
  assert.match(s,/omnios-mobile-performance-v100/);
  assert.match(s,/-webkit-backdrop-filter:none!important;backdrop-filter:none!important/);
});
