import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('js/omnios-capture-phase04.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase04.css','utf8');
const loader=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
test('Phase 04 JS parses and preserves v55 capture persistence logic',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(js,/OmniV55\?\.capture/);
 assert.match(js,/OmniV55\.capture\(String\(seed\|\|''\)\)/);
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|state\.entries|\.push\(made\)/);
});
test('Phase 04 unifies global, Today and dock Add without modifying contextual buttons',()=>{
 for(const id of ['#global-add-btn','#v35-today-add','#v55-capture-fab','#ux02-mobile-nav [data-ux02-capture]'])
   assert.ok(js.includes(id),'Missing capture affordance '+id);
 assert.match(js,/stopImmediatePropagation\(\)/);
 assert.match(js,/if\(!window\.OmniV55\?\.capture\)return/);
});
test('Capture types match the existing V55 natural language parser',()=>{
 for(const type of ['task','event','note','habit','expense','income','project','goal','journal'])
   assert.ok(js.includes("['"+type+"','")||js.includes(",'"+type+"']"));
 assert.match(js,/dispatchEvent\(new Event\('input'/);
 assert.match(js,/aria-pressed/);
 assert.match(js,/aria-labelledby/);
});
test('Browse all types delegates to existing quick-add-modal',()=>{
 assert.match(js,/window\.openModal\('quick-add-modal'\)/);
 assert.match(js,/ov\.querySelector\('\[data-v55-close\]'\)/);
 assert.match(css,/ux04-type-chip/);
});
test('Capture app assets load in real shell and are precached offline',()=>{
 assert.equal(loader.split('id="omnios-ux-phase04-styles"').length-1,1);
 assert.equal(loader.split('src="./js/omnios-capture-phase04.js"').length-1,1);
 assert.match(sw,/second-brain-shell-v11/);
 for(const asset of ['omnios-capture-phase04.js','omnios-ux-phase04.css'])
   assert.ok(sw.includes(asset));
});
