import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync('js/omnios-life-phase06.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase06.css','utf8');
const loader=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const legacy=fs.readFileSync('app-parts/part-006.html','utf8');

test('Phase 06 retains canonical V43 Life Hub and V35 delegation',()=>{
  assert.match(legacy,/function renderLife43\(\)/);
  assert.match(legacy,/window\.__secondBrainRenderLifeHub=renderLife43/);
  assert.match(legacy,/window\.renderLife35=renderLife43/);
  assert.match(js,/canonical:'v43'/);
  assert.doesNotMatch(js,/replaceViewContents|renderLife43\s*=|window\.renderLife35\s*=/);
});
test('Phase 06 preserves all ten Life Hub domains',()=>{
  for(const tab of ['people','health','home','documents','admin','learning','travel','money','journal','automations'])
    assert.match(legacy,new RegExp(tab+":\\{label:"));
  assert.match(js,/v43-domain\[data-v43-life\]/);
  assert.match(js,/v43-row\.clickable\[data-v43-life\]/);
});
test('Phase 06 links all related Life tools to existing views',()=>{
  for(const [route,label] of [['workout','Workout'],['diet','Nutrition'],['budget','Finance'],['grocery','Grocery'],['pantry','Pantry'],['wishlist','Wishlist']]){
    assert.ok(js.includes("['"+route+"','"+label+"']"),route);
  }
  assert.match(js,/window\.switchView\(id\)/);
});
test('Phase 06 keyboard activation delegates to existing domain click handlers',()=>{
  assert.match(js,/e\.key!=='Enter'&&e\.key!==' '/);
  assert.match(js,/el\.click\(\)/);
  assert.match(js,/role','button/);
  assert.match(js,/aria-label','Open /);
});
test('Phase 06 has no data-writing or broad observer behavior',()=>{
  assert.doesNotMatch(js,/localStorage|indexedDB|saveState\(|persist43\(|\.innerHTML\s*=/);
  assert.match(js,/observe\(root,\{childList:true\}\)/);
  assert.match(js,/observe\(content,\{childList:true\}\)/);
  assert.doesNotMatch(js,/subtree:true/);
  assert.doesNotThrow(()=>new vm.Script(js));
});
test('Phase 06 mobile surfaces remain responsive and restore existing navigation',()=>{
  assert.match(css,/max-width:760px/);
  assert.match(css,/\.v43-domain-grid\{grid-template-columns:minmax\(0,1fr\)/);
  assert.match(css,/\.v43-life-select\{min-height:44px/);
  assert.match(css,/ux06-life-tools/);
  assert.match(css,/:focus-visible/);
});
test('Phase 06 app shell includes offline Life Hub assets once',()=>{
  assert.equal(loader.split('id="omnios-ux-phase06-styles"').length-1,1);
  assert.equal(loader.split('src="./js/omnios-life-phase06.js"').length-1,1);
  assert.match(sw,/second-brain-shell-v10/);
  assert.ok(sw.includes("'./styles/omnios-ux-phase06.css'"));
  assert.ok(sw.includes("'./js/omnios-life-phase06.js'"));
});
