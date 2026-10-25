import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
const script=fs.readFileSync('js/omnios-today-phase03.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase03.css','utf8');
function fixture(){
 const widgets=Array.from({length:6},(_,i)=>'<article data-widget="'+i+'">Widget '+i+'</article>').join('');
 const captures=Array.from({length:8},(_,i)=>'<div class="v35-row" data-capture="'+i+'"><button>Process</button></div>').join('');
 const html='<section id="view-today" class="view active"><header class="omr-day-hero"><h3>Today</h3></header>'+
 '<section class="om3-daily-glance">'+Array.from({length:4},()=>'<div class="omr-stat">Stat</div>').join('')+'</section>'+
 '<div id="v58-attention"><button id="v58-attention-open">Notifications</button><button id="v58-automation-open">Automations</button></div>'+
 '<div class="om3-today-grid"><div class="omr-priority-panel"><button>All tasks</button></div>'+
 '<div class="omr-agenda-panel"><div class="omr-zero">Free day</div></div>'+
 '<div class="om3-capture-panel"><input id="v35-today-capture"></div>'+
 '<div class="omr-habits-panel"><button>Complete habit</button></div>'+
 '<div class="om3-nutrition-panel">Nutrition</div>'+
 '<div class="omr-signals-panel"><div class="v35-empty">No alerts</div></div></div>'+
 '<div id="v58-today-intelligence">Insights</div></section>'+
 '<section id="view-dashboard" class="view"><div id="v55-dashboard-widgets">'+widgets+'</div></section>'+
 '<section id="view-inbox" class="view"><div class="v35-page-head"><div class="v35-page-actions"><button id="v35-inbox-process">Process oldest</button></div></div>'+
 '<div class="v35-list">'+captures+'</div></section>';
 const dom=new JSDOM('<!doctype html><html><body>'+html+'</body></html>',{
  url:'https://omnios.test/',runScripts:'outside-only',pretendToBeVisual:true
 });
 const w=dom.window;
 w.switchView=(id)=>{
  for(const el of w.document.querySelectorAll('.view'))el.classList.toggle('active',el.id==='view-'+id);
 };
 w.eval(script);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return {dom,w,d:w.document};
}
const tick=()=>new Promise(resolve=>setTimeout(resolve,2));
test('Phase 18: Today keeps priorities and actions while hiding secondary panels until requested',async()=>{
 const {dom,d,w}=fixture();await tick();
 const root=d.getElementById('view-today');
 assert.equal(root.querySelectorAll('.ux03-command-actions .ux03-command').length,4);
 assert.equal(root.querySelector('.omr-priority-panel').classList.contains('ux18-collapsed-section'),false);
 for(const selector of ['.omr-agenda-panel','.om3-capture-panel','.omr-habits-panel','.om3-nutrition-panel','.omr-signals-panel']){
   assert.equal(root.querySelector(selector).classList.contains('ux18-collapsed-section'),true,selector);
 }
 const more=root.querySelector('#ux18-today-more');assert.ok(more);
 assert.equal(more.getAttribute('aria-expanded'),'false');
 more.click();
 assert.equal(more.getAttribute('aria-expanded'),'true');
 assert.ok(!root.querySelector('.omr-habits-panel').classList.contains('ux18-collapsed-section'));
 assert.ok(root.querySelector('#v35-today-capture'),'original data-entry field intact');
 assert.ok(root.querySelector('#v58-attention-open'),'notifications remain accessible');
 root.querySelector('#ux03-connected-toggle').click();
 assert.equal(w.OmniToday03.expanded,true);
 dom.window.close();
});
test('Phase 18: actionable signals and scheduled agenda remain visible by default',async()=>{
 const {dom,d,w}=fixture();await tick();
 d.querySelector('.omr-agenda-panel').innerHTML='<button class="omr-timeline-row">10:00 Appointment</button>';
 d.querySelector('.omr-signals-panel').innerHTML='<div class="v35-row">Renew document</div>';
 w.OmniToday03.refresh();await tick();
 for(const selector of ['.omr-agenda-panel','.omr-signals-panel']){
  assert.equal(d.querySelector('#view-today '+selector).classList.contains('ux18-collapsed-section'),false);
 }
 dom.window.close();
});
test('Phase 18: Dashboard widgets can be expanded without recreating controls',async()=>{
 const {dom,d,w}=fixture();await tick();
 const root=d.getElementById('view-dashboard');
 const cards=[...root.querySelectorAll('#v55-dashboard-widgets > article')];
 assert.equal(cards.length,6);
 assert.ok(cards.slice(3).every(c=>c.classList.contains('ux18-collapsed-section')));
 const toggle=root.querySelector('#ux18-dashboard-more');assert.ok(toggle);
 toggle.click();
 assert.ok(cards.every(c=>!c.classList.contains('ux18-collapsed-section')));
 assert.equal(toggle.getAttribute('aria-expanded'),'true');
 root.querySelector('.ux03-return-button').click();
 assert.ok(d.querySelector('#view-today').classList.contains('active'));
 dom.window.close();
});
test('Phase 18: Inbox shows five captures first; all original processing buttons remain',async()=>{
 const {dom,d}=fixture();await tick();
 const rows=[...d.querySelectorAll('#view-inbox .v35-list > .v35-row')];
 assert.equal(rows.length,8);
 assert.ok(rows.slice(5).every(x=>x.classList.contains('ux18-collapsed-section')));
 const button=d.querySelector('#ux18-inbox-more');assert.match(button.textContent,/Show all 8 captures/);
 button.click();
 assert.ok(rows.every(x=>!x.classList.contains('ux18-collapsed-section')));
 assert.equal(rows.filter(x=>!!x.querySelector('button')).length,8);
 button.click();assert.equal(button.getAttribute('aria-expanded'),'false');
 dom.window.close();
});
test('Phase 18: respects mobile target sizes, focus states, hidden panel recovery and Phase 12 controls',()=>{
 const block=css.split('/* Phase 18 — progressive disclosure')[1];
 assert.ok(block);
 assert.match(block,/ux18-collapsed-section/);
 assert.match(block,/min-height:44px!important/);
 assert.match(block,/focus-visible/);
 assert.match(block,/@media\(max-width:760px\)/);
 assert.ok(script.includes('Today shortcuts'));
 assert.ok(script.includes("button('Insights','dashboard')"));
});
