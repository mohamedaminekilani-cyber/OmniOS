import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

test('startup renders only the active core page',()=>{
  const s=fs.readFileSync('app-parts/part-002.html','utf8');
  assert.match(s,/if \(!renderActiveCoreView\(\)\) applyCustomIcons\(\)/);
  assert.doesNotMatch(s,/applyFocusDefaultsToTimer\(\);\s*renderAll\(\);/);
});

test('save wrappers redraw only the visible finance, list, or diet page',()=>{
  const s=fs.readFileSync('app-parts/part-002.html','utf8');
  assert.match(s,/active==='view-budget'.*active==='view-wishlist'.*active==='view-grocery'/s);
  assert.match(s,/active==='view-diet'.*active==='view-settings'/s);
  assert.match(s,/function renderRelevantAfterChange\(\)\{saveState\(\);\}/);
  assert.doesNotMatch(s,/oldSaveState\(\);\s*try\{renderFinanceExtension\(\);renderWishlist\(\);renderGrocery\(\)/);
});
