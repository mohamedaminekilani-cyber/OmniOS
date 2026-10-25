import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const script=fs.readFileSync('js/omnios-navigation-phase02.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');
const viewIds=['today','dashboard','inbox','planner','master-calendar','tasks',
 'projects','routine','habits','goals','reminders','focus','automations',
 'life-hub','workout','diet','budget','grocery','pantry','wishlist',
 'notes','bible','templates','relations','activity','studio','data-center',
 'passwords','settings','help'];
function setup(){
 const sidebar=viewIds.map(id=>'<button class="nav-item" data-view="'+id+'">'+id+'</button>').join('');
 const views=viewIds.map(id=>'<section class="view '+(id==='today'?'active':'')+'" id="view-'+id+'"></section>').join('');
 const dom=new JSDOM('<!doctype html><html><body><aside class="sidebar"><div class="nav-menu">'+sidebar+'</div></aside><nav class="mobile-nav"></nav><h1 id="view-title">Today</h1>'+views+'</body></html>',
   {url:'https://example.test/OmniOS/',runScripts:'outside-only',pretendToBeVisual:true});
 const {window:w}=dom;
 w.switchView=id=>{
  for(const el of w.document.querySelectorAll('.view'))el.classList.toggle('active',el.id==='view-'+id);
  w.document.getElementById('view-title').textContent=id;
 };
 w.eval(script);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {dom,w,d:w.document,drawer:w.document.getElementById('ux02-nav-drawer')};
}
test('Phase 17: initial mobile sheet keeps all pages in selected section and announces count',()=>{
 const {dom,w,d,drawer}=setup();
 assert.ok(w.OmniNav02);
 d.querySelector('#ux02-mobile-nav [data-ux02-group="plan"]').click();
 assert.equal(drawer.hidden,false);
 assert.equal(drawer.dataset.ux02Group,'plan');
 assert.equal(d.body.classList.contains('ux02-drawer-open'),true);
 const pages=[...drawer.querySelectorAll('[data-ux02-view]')].map(x=>x.dataset.ux02View);
 assert.ok(pages.includes('planner')&&pages.includes('tasks')&&!pages.includes('notes'));
 assert.match(drawer.querySelector('.ux17-drawer-status').textContent,/pages in Plan/);
 assert.equal(drawer.querySelector('[role="dialog"]').getAttribute('aria-labelledby'),'ux02-drawer-title');
 dom.window.close();
});
test('Phase 17: cross-section search reveals and navigates to a page from another group',()=>{
 const {dom,w,d,drawer}=setup();
 d.querySelector('#ux02-mobile-nav [data-ux02-group="plan"]').click();
 const search=drawer.querySelector('.ux17-drawer-search');
 assert.equal(search.getAttribute('aria-label'),'Search all OmniOS pages');
 search.value='notes';search.dispatchEvent(new w.Event('input',{bubbles:true}));
 const notes=drawer.querySelector('[data-ux02-view="notes"]');
 assert.ok(notes,'Notes must be available while browsing Plan');
 assert.equal(notes.querySelector('.ux17-destination-group').textContent,'Library');
 assert.match(drawer.querySelector('.ux17-drawer-status').textContent,/matching page/);
 notes.click();
 assert.equal(drawer.hidden,true);
 assert.equal(d.body.classList.contains('ux02-drawer-open'),false);
 assert.equal(d.querySelector('#view-notes').classList.contains('active'),true);
 dom.window.close();
});
test('Phase 17: no-result state, close-and-reopen reset, and Escape restore trigger focus',()=>{
 const {dom,w,d,drawer}=setup();
 const trigger=d.querySelector('#ux02-mobile-nav [data-ux02-group="life"]');
 trigger.focus();trigger.click();
 const input=drawer.querySelector('.ux17-drawer-search');
 input.value='something-very-unlikely-xyz';
 input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(drawer.querySelectorAll('[data-ux02-view]').length,0);
 assert.ok(drawer.querySelector('.ux17-drawer-empty'));
 d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 assert.equal(drawer.hidden,true);
 assert.equal(d.activeElement,trigger);
 trigger.click();
 assert.equal(input.value,'');
 assert.ok(drawer.querySelectorAll('[data-ux02-view]').length>0);
 dom.window.close();
});
test('Phase 17: mobile CSS provides phone touch targets, safe areas and distinct section colors',()=>{
 const phase=css.split('/* Phase 17 — deliberate phone navigation:')[1];
 assert.ok(phase);
 for(const id of ['today','plan','life','library'])assert.ok(phase.includes('data-ux02-group="'+id+'"'));
 assert.match(phase,/min-height:56px!important/);
 assert.match(phase,/min-height:49px!important/);
 assert.match(phase,/grid-template-columns:minmax\(0,1fr\)!important/);
 assert.match(phase,/env\(safe-area-inset-bottom\)/);
 assert.match(phase,/ux17-drawer-search:focus-visible/);
 assert.ok(css.includes('Phase 16 — restore colored'),'desktop colored-group treatment must remain');
});
