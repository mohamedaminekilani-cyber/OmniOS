import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const nav=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');
const today=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
const n=nav.slice(nav.lastIndexOf('/* OmniOS Phase 13 —'));
const t=today.slice(today.lastIndexOf('/* Phase 11'));
test('Phase 11 navigation keeps existing links and accessible states',()=>{
 assert.match(n,/\.ux02-side-links/);
 assert.match(n,/\.ux02-side-toggle/);
 assert.match(n,/\.nav-item\.active/);
 assert.match(n,/\.ux02-side-links\[hidden\]\{display:none!important\}/);
 const expanded=n.replace(/\.ux02-side-links\[hidden\]\{display:none!important\}/,'');
 assert.doesNotMatch(expanded,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
 assert.match(n,/prefers-reduced-motion/);
});
test('Phase 11 Today polish preserves all cards and actions',()=>{
 assert.match(t,/#view-today/);
 assert.match(t,/#v58-attention/);
 assert.match(t,/\.card,\.ux-card/);
 assert.match(t,/max-width:760px/);
 assert.doesNotMatch(t,/!important|display\s*:\s*none|visibility\s*:\s*hidden/);
});

test('Phase 11.2 Today keeps visible controls and honors reduced motion',()=>{
 const section=today.slice(today.lastIndexOf('/* Phase 11.2'));
 assert.match(section,/#view-today/);
 assert.match(section,/focus-visible/);
 assert.match(section,/prefers-reduced-motion:reduce/);
 assert.match(section,/tabular-nums/);
 assert.doesNotMatch(section,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
});
