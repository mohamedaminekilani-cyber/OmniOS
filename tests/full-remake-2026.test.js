import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const base=fs.readFileSync('app-parts/part-001.html','utf8');
const todaySource=fs.readFileSync('app-parts/part-004.html','utf8');
const last=fs.readFileSync('app-parts/part-028.html','utf8');
const css=last.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1]||'';
const navJs=last.match(/<script id="omnios-remake-mobile-nav">([\s\S]*?)<\/script>/)?.[1]||'';
const mobileNav=base.match(/<nav class="mobile-nav omr-mobile-dock"[\s\S]*?<\/nav>/)?.[0]||'';

test('full remake contains source-backed CSS and a five-destination mobile dock',()=>{
 assert.ok(css.includes('OmniOS REMAKE v1'));
 assert.ok(css.includes('omr-day-main'));
 assert.ok(css.includes('omr-panel-head'));
 assert.ok(css.includes('omr-mobile-dock'));
 assert.equal((mobileNav.match(/<button/g)||[]).length,5);
 assert.ok(mobileNav.includes('id="omr-mobile-more"'));
 assert.ok(mobileNav.includes('data-mobile-view="dashboard"'));
 for(const name of ['master-calendar','tasks','habits'])assert.ok(mobileNav.includes('data-mobile-view="'+name+'"'));
 assert.ok(!mobileNav.includes('data-mobile-view="workout"'));
});

test('accessible mobile More sheet offers full navigation and preserves keyboard closing',()=>{
 const dom=new JSDOM('<!doctype html><html><head></head><body><aside class="sidebar"><nav class="nav-menu"><div class="nav-section" data-v35-section="Plan">Plan</div><button class="nav-item" data-view="today">Today</button><button class="nav-item" data-view="dashboard">Dashboard</button><div class="nav-section" data-v35-section="Wellbeing">Wellbeing</div><button class="nav-item" data-view="workout">Workout</button><button class="nav-item" data-view="diet">Nutrition</button></nav></aside>'+mobileNav+'</body></html>',{runScripts:'outside-only',url:'https://example.test/',pretendToBeVisual:true});
 const w=dom.window;const destinations=[];w.switchView=x=>destinations.push(x);
 w.eval(navJs);
 const more=w.document.getElementById('omr-mobile-more');
 more.click();
 const drawer=w.document.getElementById('omr-mobile-drawer');
 assert.ok(drawer&&!drawer.hidden);
 assert.equal(drawer.getAttribute('role'),'presentation');
 assert.equal(drawer.querySelector('[role="dialog"]').getAttribute('aria-modal'),'true');
 assert.equal(drawer.querySelectorAll('[data-omr-go]').length,4);
 drawer.querySelector('[data-omr-go="workout"]').click();
 assert.deepEqual(destinations,['workout']);
 assert.equal(drawer.hidden,true);
 more.click();
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));
 assert.equal(drawer.hidden,true);
 dom.window.close();
});

test('Today is rebuilt with real actions, compact agenda, priority list, and progress',()=>{
 const a=todaySource.indexOf('function renderToday35(){');
 const b=todaySource.indexOf('function todaySignals35(){',a);
 assert.ok(a>0&&b>a);
 const fn=todaySource.slice(a,b);
 for(const selector of ['omr-day-hero','omr-day-main','omr-feature','omr-timeline','omr-priority-list','omr-stats-grid','omr-habit-row']){
   assert.ok(fn.includes(selector),'missing structural element '+selector);
 }
 assert.ok(fn.includes('captureInbox35'));
 assert.ok(fn.includes('renderToday35()'));
 assert.ok(fn.includes('window.switchView'));
 const dom=new JSDOM('<!doctype html><body><section id="view-today"></section></body>',{runScripts:'outside-only',url:'https://example.test/'});
 const w=dom.window;
 w.state={habits:[{id:'h',name:'Read',log:{}}],transactions:[],life:{todayPins:{'2026-10-11':[]}}};
 w.eval([
  'function root(id){return document.getElementById("view-"+id)}',
  'function todayKey(){return "2026-10-11"}',
  'function dueTasks35(){return []}',
  'function todayEvents35(){return []}',
  'function todayBlocks35(){return []}',
  'function taskById(){return null}',
  'function areaById(){return null}',
  'function todayNutrition35(){return {calories:0,protein:0,carbs:0,fat:0}}',
  'function money(){return "$0.00"}',
  'function dateLabel(x){return x}',
  'function esc(x){return String(x).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/"/g,"&quot;")}',
  'function todaySignals35(){return "<p>Nothing pending</p>"}',
  'function captureInbox35(x){window.lastCapture=x}',
  'function openModal(x){window.lastModal=x}',
  'function openJournalQuick35(){}',
  'function editTask(){}',
  'function showPowerSidebarFor(){}',
  'window.switchView=function(x){window.lastDestination=x}',
  'window.saveState=function(){window.saved=true}'
 ].join('\n'));
 w.eval(fn);
 w.renderToday35();
 assert.ok(w.document.querySelector('.omr-day-hero h3'));
 assert.equal(w.document.querySelectorAll('.omr-stat').length,4);
 assert.ok(w.document.querySelector('.omr-zero'));
 const input=w.document.querySelector('#v35-today-capture');input.value='Remember meeting';
 w.document.querySelector('#v35-today-capture-btn').click();
 assert.equal(w.lastCapture,'Remember meeting');
 w.document.querySelector('[data-v35-habit]').click();
 assert.equal(w.state.habits[0].log['2026-10-11'],true);
 assert.equal(w.saved,true);
 dom.window.close();
});

test('all six Tech SaaS colors remain and old gradients are overridden',()=>{
 for(const color of ['#101114','#EEF0F2','#2547E8','#5F31C4','#C6F04A','#55606D'])assert.ok(css.includes(color));
 assert.match(css,/background:var\(--omr-panel\)/);
 assert.match(css,/box-shadow:none!important/);
 assert.match(css,/prefers-reduced-motion:reduce/);
});
