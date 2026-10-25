import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('styles/omnios-ux-phase07.css','utf8');
const foundation=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
const phase=css.slice(css.indexOf('/* UX Phase 10.3:'),css.indexOf('/* Phase 14 — real-module visual system.'));
test('Phase 10.3 canonical headers and forms reuse the design contract',()=>{
 assert.ok(phase.startsWith('/* UX Phase 10.3:'));
 for(const view of ['workout','diet','budget','habits','notes'])assert.ok(phase.includes('#view-'+view));
 for(const selector of ['.v38-finance-head','.org-hero','.nut-hero','.workout-hero','.org-actions','.form-group'])
   assert.ok(phase.includes(selector),selector);
 for(const token of ['--ux-header-gap','--ux-nav-gap','--ux-leading-tight','--ux-focus','--ux-control-height'])
   assert.ok(phase.includes('var('+token+')'),token);
 assert.match(foundation,/--ux-header-gap:/);
 assert.doesNotMatch(phase,/!important|display:none|visibility:hidden|pointer-events:none/);
});
test('Phase 10.3 does not modify event handlers, route IDs or user data',()=>{
 assert.doesNotMatch(phase,/localStorage|indexedDB|addEventListener|\.innerHTML|saveState/);
 assert.match(phase,/input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)/);
 assert.match(phase,/font-size:max\(16px,1em\)/);
 assert.match(phase,/:focus-visible/);
});
