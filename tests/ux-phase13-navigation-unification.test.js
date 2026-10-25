import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const css=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');
const js=fs.readFileSync('js/omnios-navigation-phase02.js','utf8');
const portion=css.slice(css.indexOf('/* OmniOS Phase 13 —'));
test('Phase 13 defines one shared navigation authority for the v101 and intent sidebars',()=>{
 assert.ok(portion.startsWith('/* OmniOS Phase 13 —'));
 for(const selector of [
  '.sidebar.v101-sidebar .v101-nav-group-head',
  '.sidebar.v101-sidebar .v101-nav-group-body',
  '.sidebar.v101-sidebar .nav-item[data-view]',
  '.sidebar .ux02-side-toggle',
  '.sidebar .ux02-side-links>.nav-item',
  '.ux02-mobile-tab.active'
 ])assert.ok(portion.includes(selector),selector);
 assert.match(portion,/font-size:13px!important/);
 assert.match(portion,/min-height:43px!important/);
 assert.match(portion,/@media\(max-width:760px\)/);
 assert.match(portion,/prefers-reduced-motion:reduce/);
});
test('Phase 13 preserves compact mode, visibility and the existing destination handlers',()=>{
 assert.match(portion,/html:not\(\.om2-compact\) body \.sidebar\.v101-sidebar/);
 assert.doesNotMatch(portion,/localStorage|indexedDB|addEventListener|\.innerHTML|window\.switchView/);
 const hidden=portion.match(/display:none!important/g)||[];
 assert.equal(hidden.length,1,'only the existing hidden-panel selector can suppress display');
 assert.match(portion,/\.ux02-side-links\[hidden\]\{display:none!important\}/);
 assert.match(js,/nav\.replaceChildren\(fragment\)/);
 assert.match(js,/groups\[i\]\.rows\.push\(b\)/);
 assert.match(js,/if\(!accounted\.has\(id\)\)groups\[3\]\.rows\.push\(b\)/);
});
