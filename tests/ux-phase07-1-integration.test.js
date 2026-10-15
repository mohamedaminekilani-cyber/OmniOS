import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sourceRelease} from '../scripts/release-source.mjs';

const read=path=>fs.readFileSync(path,'utf8');
const loader=read('index.html');
const sw=read('sw.js');
const life=read('js/omnios-life-hub-phase06.js');
const modules=read('js/omnios-modules-phase07.js');
const qa=read('scripts/phase7-browser-qa.mjs');
const lifeCSS=read('styles/omnios-ux-phase06.css');
const source=JSON.parse(read('source-release.json'));

test('UX 07.1 loads only the newer Phase 06 bridge alongside Phase 07',()=>{
 assert.equal(loader.split('src="./js/omnios-life-hub-phase06.js"').length-1,1);
 assert.equal(loader.split('src="./js/omnios-modules-phase07.js"').length-1,1);
 assert.equal(loader.split('id="omnios-ux-phase06-styles"').length-1,1);
 assert.equal(loader.split('id="omnios-ux-phase07-styles"').length-1,1);
 assert.doesNotMatch(loader,/omnios-life-phase06\.js/);
 assert.equal(fs.existsSync('js/omnios-life-phase06.js'),false);
 assert.equal(sw.split("'./js/omnios-life-hub-phase06.js'").length-1,1);
 assert.equal(sw.split("'./js/omnios-modules-phase07.js'").length-1,1);
 assert.doesNotMatch(sw,/omnios-life-phase06\.js/);
});

test('UX 07.1 preserves original data authority and Phase 07 module handlers',()=>{
 assert.equal(source.sha256,sourceRelease().manifest.sha256);
 assert.match(life,/canonical:'v43'/);
 assert.match(life,/window\.switchView\(id\)/);
 assert.match(life,/new MutationObserver\(schedule\)\.observe\(root,\{childList:true\}\)/);
 assert.match(life,/new MutationObserver\(schedule\)\.observe\(content,\{childList:true\}\)/);
 assert.doesNotMatch(life+modules,/localStorage\.setItem|indexedDB|persistWorkspace|saveState|\.innerHTML\s*=/);
 assert.doesNotMatch(life+modules,/subtree:true/);
 assert.doesNotThrow(()=>new vm.Script(life));
 assert.doesNotThrow(()=>new vm.Script(modules));
});

test('UX 07.1 keeps new six-card Life shortcuts and all five polished modules',()=>{
 assert.match(lifeCSS,/\.ux06-links-grid/);
 assert.match(lifeCSS,/grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 for(const route of ['workout','diet','budget','grocery','pantry','wishlist'])
  assert.ok(life.includes("id:'"+route+"'"),route);
 for(const route of ['workout','diet','budget','habits','notes'])
  assert.ok(modules.includes("'"+route+"'"),route);
});

test('UX 07.1 browser suite exercises both canonical Life Hub and all Phase 07 modules',()=>{
 for(const marker of ['Phase 06 external shortcut opens a Life Hub domain','Phase 06 Life Hub fits','Phase 07 Notes mobile layout tabs','Phase 07 original modal actions'])
  assert.ok(qa.includes(marker),'Missing browser QA: '+marker);
 assert.match(sw,/second-brain-shell-v12/);
});
