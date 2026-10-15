import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {spawnSync} from 'node:child_process';

const js=fs.readFileSync('js/omnios-calendar-phase05.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase05.css','utf8');
const loader=fs.readFileSync('index.html','utf8');
const sw=fs.readFileSync('sw.js','utf8');
function getAdapter(){
 const window={};
 const document={readyState:'loading',addEventListener(){}};
 vm.runInNewContext(js,{window,document,console,Date,Number,Math,queueMicrotask}, {filename:'omnios-calendar-phase05.js'});
 return window.OmniCalendar05;
}
function iso(d){return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')}
test('Phase 05 clamps month navigation rather than skipping February',()=>{
 const api=getAdapter();
 assert.equal(iso(api.clampMonth(new Date(2026,0,31,12),1)),'2026-02-28');
 assert.equal(iso(api.clampMonth(new Date(2028,0,31,12),1)),'2028-02-29');
 assert.equal(iso(api.clampMonth(new Date(2026,2,31,12),-1)),'2026-02-28');
 assert.equal(iso(api.clampMonth(new Date(2026,11,31,12),1)),'2027-01-31');
 assert.equal(iso(api.clampMonth(new Date(2026,0,30,12),-1)),'2025-12-30');
 assert.equal(api.clampMonth(new Date('invalid'),1),null);
});
test('Phase 05 leaves all existing event handlers and storage contracts intact',()=>{
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|\.calendarEvents\s*=|\.entries\s*=/);
 assert.match(js,/window\.renderMasterCalendar\(\)/);
 assert.match(js,/stopImmediatePropagation\(\)/);
 assert.match(js,/closest\?\./);
 assert.doesNotMatch(js,/innerHTML\s*=/);
});
test('Phase 05 calendar keeps five existing view modes reachable',()=>{
 const parts=fs.readFileSync('app-parts/part-004.html','utf8');
 for(const name of ['workspace','week','month','day','agenda'])assert.ok(parts.includes("'"+name+"'"));
 assert.match(css,/\.v36-cal-modes/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/repeat\(7,minmax\(0,1fr\)\)/);
});
test('Phase 05 screen-reader calendar and empty-state support is scoped',()=>{
 assert.match(js,/role','grid/);
 assert.match(js,/role','gridcell/);
 assert.match(js,/ux05-calendar-empty/);
 assert.match(js,/No visible items this month/);
 assert.match(css,/ux05-empty-hint/);
 assert.match(css,/#view-master-calendar/);
});
test('Phase 05 loads through real loader and precaches offline',()=>{
 assert.equal(loader.split('id="omnios-ux-phase05-styles"').length-1,1);
 assert.equal(loader.split('src="./js/omnios-calendar-phase05.js"').length-1,1);
 assert.match(sw,/second-brain-shell-v10/);
 assert.ok(sw.includes("'./styles/omnios-ux-phase05.css'"));
 assert.ok(sw.includes("'./js/omnios-calendar-phase05.js'"));
});
test('Phase 05 JS parses and uses one bounded child-list observer',()=>{
 assert.doesNotThrow(()=>new vm.Script(js));
 assert.match(js,/observe\(host,\{childList:true\}\)/);
 assert.doesNotMatch(js,/subtree:true/);
});

test('Phase 05 overrides legacy hidden mobile view tabs on the original Calendar',()=>{
 assert.match(css,/html body #view-master-calendar \.v36-cal-center\{\s*display:flex!important/);
 assert.match(css,/html body #view-master-calendar \.v36-cal-modes\{\s*display:flex!important/);
});

test('Browser QA runner source parses before expensive browser checks',()=>{
 const result=spawnSync(process.execPath,['--check','scripts/phase7-browser-qa.mjs'],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr||'Browser QA runner syntax invalid');
});

test('Phase 05 restores the existing mobile calendar mode row after legacy renderers',()=>{
 assert.match(js,/center\.style\.setProperty\('display','flex','important'\)/);
 assert.match(js,/center\.hidden=false/);
 assert.match(js,/center\.style\.removeProperty\('display'\)/);
 assert.match(js,/requestAnimationFrame\(decorate\)/);
});

test('Phase 05 mobile renders all five existing view buttons, not just the active one',()=>{
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
 assert.match(js,/b\.style\.setProperty\('display','inline-flex','important'\)/);
 assert.match(js,/b\.style\.removeProperty\('display'\)/);
});
