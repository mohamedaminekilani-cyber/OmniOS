import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('styles/omnios-ux-phase07.css','utf8');
const part=css.slice(css.indexOf('/* Phase 14 — real-module visual system'));
test('Phase 14 has one visual contract for five actual module headers and actions',()=>{
 assert.ok(part.startsWith('/* Phase 14 — real-module visual system'));
 for(const s of ['#view-workout .workout-hero','#view-diet .nut-hero','#view-budget .v38-finance-head','#view-notes .org-hero','#view-habits .omx-page-heading',
   '#view-workout .workout-hero-actions','#view-budget .v38-finance-head-actions','#view-notes .org-actions','#view-habits .habit-toolbar'])
   assert.ok(part.includes(s),s);
 assert.match(part,/font-size:clamp\(25px,2\.3vw,34px\)/);
 assert.match(part,/min-height:42px/);
 assert.match(part,/min-height:44px/);
 assert.match(part,/@media\(max-width:760px\)/);
 assert.match(part,/@media\(prefers-reduced-motion:reduce\)/);
});
test('Phase 14 is strictly presentational: existing controls and data remain visible and untouched',()=>{
 assert.doesNotMatch(part,/display\s*:\s*none|visibility\s*:\s*hidden|pointer-events\s*:\s*none/);
 assert.doesNotMatch(part,/position:\s*fixed|localStorage|indexedDB|innerHTML|saveState/);
 assert.match(part,/focus-visible/);
});
