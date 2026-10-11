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

function relativeLuminance(hex){
 const v=hex.match(/[a-f0-9]{2}/gi).map(x=>parseInt(x,16)/255);
 const [r,g,b]=v.map(x=>x<=.04045?x/12.92:Math.pow((x+.055)/1.055,2.4));
 return .2126*r+.7152*g+.0722*b;
}
function contrast(a,b){
 const x=relativeLuminance(a),y=relativeLuminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test('Tech SaaS colors are exact and all text foregrounds have WCAG AA contrast',()=>{
 const colors=['#101114','#EEF0F2','#2547E8','#5F31C4','#C6F04A','#55606D'];
 for(const color of colors) assert.ok(css.includes(color),'missing official palette color '+color);
 for(const [fg,bg] of [
  ['#EEF0F2','#101114'],['#101114','#EEF0F2'],
  ['#FFFFFF','#2547E8'],['#EEF0F2','#2547E8'],
  ['#FFFFFF','#5F31C4'],['#EEF0F2','#5F31C4'],
  ['#101114','#C6F04A'],['#55606D','#EEF0F2'],
  ['#B7C0CE','#101114'],['#D1D7E0','#1A1C21']
 ]){
  assert.ok(contrast(fg,bg)>=4.5,fg+' on '+bg+' contrast '+contrast(fg,bg).toFixed(2)+':1');
 }
 assert.ok(contrast('#C6F04A','#EEF0F2')<4.5,'lime must not be used for text on Mist');
 assert.match(css,/background:var\(--omni-lime\)!important;/);
 assert.match(css,/color:var\(--omni-carbon\)!important/);
});
test('flat theme removes gradients, shadows and blur from core application surfaces',()=>{
 const start=css.indexOf('OmniOS FLAT / Tech SaaS');
 assert.ok(start>0,'flat overrides inside switchable theme');
 const flat=css.slice(start);
 for(const element of ['.sidebar','.topbar','.mobile-nav','#view-dashboard','.v43-kpi','#view-habits','#view-master-calendar','#view-workout']){
  assert.ok(flat.includes(element),'flat token rules missing '+element);
 }
 assert.match(flat,/box-shadow:none!important/);
 assert.match(flat,/background-image:none!important/);
 assert.match(flat,/backdrop-filter:none!important/);
 assert.match(flat,/@media\(max-width:760px\)/);
});
