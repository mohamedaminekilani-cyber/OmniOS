import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync('js/omnios-modules-phase07.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase07.css','utf8');
const loader=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const base=fs.readFileSync('app-parts/part-001.html','utf8');
const nutrition=fs.readFileSync('app-parts/part-006.html','utf8');

test('Phase 07 preserves five original module routes and handlers',()=>{
 for(const id of ['workout','diet','budget','habits','notes']){
   assert.ok((base+nutrition).includes('view-'+id),'Missing module route '+id);
 }
 assert.match(base,/id="workout-start-btn"/);
 assert.match(base,/id="notes-search"/);
 assert.match(base,/data-habitview="calendar"/);
 assert.match(nutrition,/id="nut-log-now"/);
 assert.match(nutrition,/installNutritionPrimaryClickRouter/);
});
test('Phase 07 is a presentation and accessibility layer, not a data writer',()=>{
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|persistWorkspace|\.innerHTML\s*=/);
 assert.doesNotMatch(js,/window\.renderDiet\s*=|window\.renderWorkout\s*=|\.remove\(\)/);
 assert.match(js,/observe\(diet,\{childList:true\}\)/);
 assert.doesNotMatch(js,/subtree:true/);
 assert.doesNotThrow(()=>new vm.Script(js));
});
test('Phase 07 preserves original Nutrition click routing',()=>{
 assert.match(nutrition,/if\(!sec\|\|sec\.dataset\.nutPrimaryRouter==='1'\)return/);
 assert.match(nutrition,/sec\.addEventListener\('click',e=>\{/);
 assert.match(nutrition,/else if\(el\.id==='nut-log-now'/);
 assert.doesNotMatch(js,/addEventListener\('click',.*(?:nut-log-now|nut-v94-log)/);
});
test('Phase 07 improves keyboard labels and selected-tab semantics',()=>{
 for(const route of ['workout','diet','habits'])assert.match(js,new RegExp("id:'"+route+"'"));
 assert.match(js,/aria-pressed/);
 assert.match(js,/aria-label/);
 assert.match(css,/:focus-visible/);
 assert.match(css,/max-width:760px/);
 assert.match(css,/\.notes-toolbar/);
});
test('Phase 07 loaders and offline shell include both assets',()=>{
 assert.equal(loader.split('id="omnios-ux-phase07-styles"').length-1,1);
 assert.equal(loader.split('src="./js/omnios-modules-phase07.js"').length-1,1);
 assert.match(sw,/second-brain-shell-v12/);
 assert.ok(sw.includes("'./styles/omnios-ux-phase07.css'"));
 assert.ok(sw.includes("'./js/omnios-modules-phase07.js'"));
});

test('Phase 07 enhances canonical Finance V38 and Notes V40, not hidden legacy controls',()=>{
 const modules=fs.readFileSync('app-parts/part-005.html','utf8');
 assert.ok(modules.includes('id="v38-add-txn"'));
 assert.ok(modules.includes('id="org-note-new"'));
 assert.match(js,/\.v38-month-nav,\.finance-period-nav/);
 assert.match(js,/#org-note-search,#notes-search/);
 assert.match(css,/#view-budget\.v38-finance-active #finance-v38-root/);
 assert.match(css,/#view-notes \.org-toolbar/);
});


test('Phase 07 exposes the actual Notes V40 layout and collection selection controls',()=>{
 const modules=fs.readFileSync('app-parts/part-005.html','utf8');
 assert.match(modules,/function seg40\(view,items\)/);
 assert.match(modules,/class="org-seg"/);
 assert.match(modules,/data-org-view=/);
 assert.match(js,/querySelector\('\.org-toolbar \.org-seg'\)/);
 assert.match(js,/querySelectorAll\('\[data-org-view\]'\)/);
 assert.match(js,/querySelectorAll\('\[data-note-scope\]'\)/);
 assert.match(js,/Note collections/);
 assert.match(css,/#view-notes \.org-toolbar \.org-seg/);
 assert.match(css,/min-height:44px/);
 assert.doesNotMatch(css,/org-segmented|org-view-switch/);
});
