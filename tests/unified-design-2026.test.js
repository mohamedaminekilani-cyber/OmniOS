import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const last=readFileSync('app-parts/part-028.html','utf8');
const dashboard=readFileSync('app-parts/part-006.html','utf8');
const baseline=readFileSync('DESIGN_ROLLBACK_2026-10-11.md','utf8');
const css=last.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1];
const code=last.match(/<script id="omnios-unified-2026-controls">([\s\S]*?)<\/script>/)?.[1];
assert.ok(css&&code,'One self-contained, final design layer must exist');

function app(){
 const html='<!doctype html><html><head><style id="omnios-unified-design-2026">'+css+'</style></head><body><header class="topbar"><h2 id="view-title">Dashboard</h2><div class="topbar-actions"><button id="global-add-btn">Quick Add</button></div></header><section id="view-settings"></section><section id="view-dashboard"><button id="omni-dashboard-capture">Next priority</button></section></body></html>';
 const dom=new JSDOM(html,{pretendToBeVisual:true,runScripts:'outside-only',url:'https://example.test/OmniOS/'});
 const w=dom.window;
 w.eval(code);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {w,dom};
}

test('dedicated pre-refresh branch and exact GitHub commit are recorded',()=>{
 assert.match(baseline,/backup\/omnios-pre-2026-10-11-ui-refresh/);
 assert.match(baseline,/51c269205ca0b2b4de7e50c26cdaa901a1638654/);
 assert.match(baseline,/localStorage\.omnios_visual_style_2026/);
});
test('new interface shares consistent dark and light tokens and mobile safe areas',()=>{
 for(const selector of ['html:not([data-theme="light"])','html[data-theme="light"]','.sidebar','.topbar','.mobile-nav','#view-dashboard','#view-habits','#view-master-calendar','#view-workout','#omni-2026-appearance']){
  assert.ok(css.includes(selector),'missing design coverage: '+selector);
 }
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
 assert.doesNotMatch(code,/MutationObserver/);
});
test('Classic appearance is reversible and persisted without touching app state',()=>{
 const {w,dom}=app();
 assert.equal(w.OmniUnifiedDesign2026.getMode(),'modern');
 assert.equal(w.document.documentElement.dataset.omniUi,'modern');
 assert.ok(w.document.getElementById('omni-unified-date'));
 const toggle=w.document.getElementById('omni-unified-mode-toggle');
 assert.ok(toggle);
 toggle.click();
 assert.equal(w.OmniUnifiedDesign2026.getMode(),'classic');
 assert.equal(w.localStorage.getItem('omnios_visual_style_2026'),'classic');
 assert.equal(w.document.getElementById('omnios-unified-design-2026').disabled,true);
 toggle.click();
 assert.equal(w.OmniUnifiedDesign2026.getMode(),'modern');
 assert.equal(w.document.getElementById('omnios-unified-design-2026').disabled,false);
 dom.window.close();
});
test('dashboard greeting and next-priority affordance work through existing Quick Add',()=>{
 assert.match(dashboard,/const greetingHour=new Date\(\)\.getHours\(\)/);
 assert.match(dashboard,/friendlyDate43/);
 assert.match(dashboard,/id="omni-dashboard-capture"/);
 const {w,dom}=app();let opened=0;
 w.document.getElementById('global-add-btn').onclick=()=>opened++;
 w.document.getElementById('omni-dashboard-capture').click();
 assert.equal(opened,1);
 dom.window.close();
});
test('primary blue action uses a contrast-safe color and workout illustrations stay removed',()=>{
 assert.match(css,/--omni-cta:#465fdf/);
 assert.match(css,/--omni-cta:#4868e7/);
 assert.match(css,/background:var\(--omni-cta\)!important/);
 const home=readFileSync('js/home-workout.js','utf8');
 assert.doesNotMatch(home,/<img|@bryllim|cdn\.jsdelivr/);
});
