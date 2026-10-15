import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync('js/omnios-life-hub-phase06.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase06.css','utf8');
const loader=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const original=fs.readFileSync('app-parts/part-006.html','utf8');

test('Phase 06 retains original Life Hub records and all ten canonical domain routes',()=>{
 assert.match(original,/function renderLife43\(/);
 assert.match(original,/function renderLifeSection43\(/);
 assert.match(original,/function renderLifeOverview43\(/);
 assert.match(js,/window\.OmniLife06/);
 for(const id of ['overview','people','health','home','documents','admin','learning','travel','money','journal','automations'])
  assert.ok(js.includes("'"+id+"'"),'Missing domain '+id);
});
test('Phase 06 preserves six standalone Life modules via original switchView',()=>{
 for(const id of ['workout','diet','budget','grocery','pantry','wishlist'])
  assert.ok(js.includes("id:'"+id+"'"),'Missing Life module '+id);
 assert.match(js,/window\.switchView\(id\)/);
 assert.match(js,/\.v43-life-rail \[data-v43-life/);
 assert.doesNotMatch(js,/location\.hash\s*=|location\.href\s*=/);
});
test('Phase 06 only decorates existing renderer and never writes personal data',()=>{
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|setItem\(|deleteLifeRecord|openRecordModal|replaceViewContents/);
 assert.doesNotMatch(js,/\.innerHTML\s*=/);
 assert.match(js,/observe\(root,\{childList:true\}\)/);
 assert.doesNotMatch(js,/subtree:true/);
});
test('Phase 06 offers accessible cards and mobile domain select',()=>{
 assert.match(js,/aria-current/);
 assert.match(js,/\.tabIndex=0/);
 assert.match(js,/role','button/);
 assert.match(js,/aria-label','Life Hub domain/);
 assert.match(css,/#v43-life-select/);
 assert.match(css,/:focus-visible/);
});
test('Phase 06 includes stylesheet and JS in real loader and offline v10 precache',()=>{
 assert.equal(loader.split('id="omnios-ux-phase06-styles"').length-1,1);
 assert.equal(loader.split('src="./js/omnios-life-hub-phase06.js"').length-1,1);
 assert.match(sw,/second-brain-shell-v10/);
 assert.ok(sw.includes("'./styles/omnios-ux-phase06.css'"));
 assert.ok(sw.includes("'./js/omnios-life-hub-phase06.js'"));
});
test('Phase 06 JavaScript parses under Node',()=>assert.doesNotThrow(()=>new vm.Script(js)));

test('Phase 06 deep-domain navigation waits for original v43 view rendering',()=>{
 assert.match(js,/if\(!route\('life-hub'\)\)return false/);
 assert.match(js,/setTimeout\(\(\)=>activateDomain\(id\),60\)/);
});
