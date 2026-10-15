import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const js=fs.readFileSync('js/omnios-today-phase03.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase03.css','utf8');
const loader=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
test('Phase 03 preserves both Today and Dashboard renderers',()=>{
 assert.match(js,/view-today/);assert.match(js,/view-dashboard/);
 assert.match(js,/window\.switchView/);
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|state\.entries/);
 assert.doesNotMatch(js,/removeChild|\.remove\(\)/);
});
test('Connected insights is accessible on demand',()=>{
 assert.match(js,/state=\{expanded:false/);assert.match(js,/Show connected insights/);
 assert.match(js,/Hide connected insights/);assert.match(js,/aria-expanded/);
 assert.match(css,/#view-today\.ux03-focus-mode #v58-today-intelligence\{display:none!important\}/);
});
test('Today commands route to existing destinations',()=>{
 for(const [label,id] of [['Tasks','tasks'],['Calendar','master-calendar'],['Inbox','inbox'],['Insights','dashboard']])
   assert.ok(js.includes("button('"+label+"','"+id+"')"));
 assert.match(js,/Back to Today/);
});
test('Control refresh watches only direct children',()=>{
 assert.match(js,/observe\(today,\{childList:true\}\)/);
 assert.match(js,/observe\(dashboard,\{childList:true\}\)/);
 assert.doesNotMatch(js,/subtree:true/);
});
test('Phase 03 loader and offline assets are included exactly once',()=>{
 assert.equal(loader.split('id="omnios-ux-phase03-styles"').length-1,1);
 assert.equal(loader.split('src="./js/omnios-today-phase03.js"').length-1,1);
 assert.match(sw,/second-brain-shell-v12/);
 assert.ok(sw.includes("'./js/omnios-today-phase03.js'"));
 assert.ok(sw.includes("'./styles/omnios-ux-phase03.css'"));
});
test('Phase 03 JavaScript parses under Node',()=>assert.doesNotThrow(()=>new vm.Script(js)));

test('Phase 03 command strip follows the existing Today greeting',()=>{
 assert.match(js,/host\.querySelector\('\.omr-day-hero'\)/);
 assert.match(js,/hero\.after\(bar\)/);
});

test('Dashboard return control is restored after delayed legacy rendering',()=>{
 assert.ok(js.includes('requestAnimationFrame(schedule)'));
 assert.ok(js.includes('setTimeout(schedule,120)'));
 assert.ok(js.includes('previousSwitch.apply(this,args)'));
});
