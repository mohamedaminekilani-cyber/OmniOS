import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');
const phase=css.split('/* Phase 15 — Efficient navigation:')[1];
test('efficient sidebar design covers both legacy and intent renderers',()=>{
 assert.ok(phase,'Phase 15 sidebar stylesheet is loaded');
 for(const selector of ['.sidebar.v101-sidebar','.v101-nav-group-head','.v101-nav-group-body','.nav-item[data-view]','.ux02-side-toggle','.ux02-side-links','.ux02-mobile-nav','.ux02-drawer-sheet']){
  assert.ok(phase.includes(selector),'missing navigation selector: '+selector);
 }
});
test('navigation remains scrollable, accessible, and compact-mode-safe',()=>{
 assert.match(phase,/overflow-y:auto/);
 assert.match(phase,/overscroll-behavior:contain/);
 assert.match(phase,/html:not\(\.om2-compact\)/);
 assert.match(phase,/@media \(max-width:760px\)/);
 assert.doesNotMatch(phase,/display:\s*none\s*!important/);
 assert.doesNotMatch(phase,/pointer-events:\s*none/);
});
