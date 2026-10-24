import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const foundation=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
const nav=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');
test('Phase 12 Today polish keeps cards and action controls visible',()=>{
 const s=foundation.slice(foundation.lastIndexOf('/* Phase 12'));
 for(const q of ['#view-today','#v58-attention','.card,.ux-card','focus-within','prefers-reduced-motion'])assert.ok(s.includes(q),q);
 assert.doesNotMatch(s,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none|!important/);
});
test('Phase 12 sidebar retains all navigation destinations',()=>{
 const s=nav.slice(nav.lastIndexOf('/* Phase 12'));
 assert.match(s,/\.ux02-side-toggle/);
 assert.match(s,/\.ux02-side-links>\.nav-item.active/);
 assert.match(s,/\.ux02-mobile-tab.active/);
 assert.doesNotMatch(s,/display\s*:\s*none|visibility\s*:\s*hidden/);
});
