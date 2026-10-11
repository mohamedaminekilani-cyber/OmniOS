import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const source=fs.readFileSync('app-parts/part-004.html','utf8');
const handlers=fs.readFileSync('app-parts/part-005.html','utf8');
const last=fs.readFileSync('app-parts/part-028.html','utf8');
const css=last.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1]||'';
const planner=source.slice(source.indexOf('function renderPlanner35(){'),source.indexOf('function occupied35('));
const month=source.slice(source.indexOf('function renderMonthV36('),source.indexOf('function layoutTimedV36(',source.indexOf('function renderMonthV36(')));

test('Phase 4 is the final reversible layer with mobile layouts',()=>{
 const p1=css.indexOf('OMNIOS PHASE 1 FOUNDATION / v1');
 const p2=css.indexOf('OMNIOS PHASE 2 APPLICATION SHELL / v1');
 const p3=css.indexOf('OMNIOS PHASE 3 / DAILY WORKSPACE');
 const p4=css.indexOf('OMNIOS PHASE 4 / CALENDAR + PLANNER / v1');
 assert.ok(p1>=0&&p2>p1&&p3>p2&&p4>p3);
 const phase=css.slice(p4);
 for(const q of ['v36-month-grid','v36-month-day','om4-month-indicators','v36-cal-mode',
  'v36-time-wrap','v36-agenda','v65-mobile-week','v35-week-grid','om4-task-actions',
  'v35-unscheduled','@media(max-width:760px)','var(--ds-surface)','var(--ds-text-muted)',
  'box-shadow:none!important']){
  assert.ok(phase.includes(q),'Missing style '+q);
 }
 assert.doesNotMatch(phase,/MutationObserver|localStorage|fetch\(/);
});

test('Calendar navigation supports all five modes with labels and preserved actions',()=>{
 const render=source.slice(source.indexOf('function renderMasterCalendarV36(){'),source.indexOf('(function(){\n  if(window.__habitTabsV105',source.indexOf('function renderMasterCalendarV36(){')));
 for(const mode of ['workspace','week','month','day','agenda']){
  assert.ok(render.includes("['"+mode+"'"),'Missing '+mode+' mode');
 }
 for(const q of ['aria-pressed=','aria-label="Calendar view"','aria-label="Search calendar events"',
  'aria-live="polite"']){
  assert.ok(render.includes(q),'Missing calendar accessibility '+q);
 }
 assert.match(handlers,/bindDragV36\(\)/);
 assert.match(handlers,/fresh\?\.focus\(\{preventScroll:true\}\)/);
});

test('Month renderer produces visible dates, accessible day counts, dots and overflow',()=>{
 assert.ok(month.startsWith('function renderMonthV36('));
 const dom=new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>',{
  url:'https://example.test/',runScripts:'outside-only',pretendToBeVisual:true
 });
 const w=dom.window;
 w.eval([
 'var masterCalendarDate=new Date(2026,9,11,12);',
 'function startOfWeekV36(date){const d=new Date(date);d.setDate(d.getDate()-d.getDay());return d}',
 'function endOfWeekV36(date){const d=startOfWeekV36(date);d.setDate(d.getDate()+6);return d}',
 'function addDaysV36(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}',
 'function localDateString(date){const d=date||new Date(2026,9,11,12);return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0")}',
 'function weekdayNamesV36(){return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}',
 'function getSetting(){return "sunday"}',
 'function wsV36(){return {showWeekends:true,density:"compact"}}',
 'function eventSortV36(a,b){return a.title.localeCompare(b.title)}',
 'function eventColorV36(){return "#2547E8"}',
 'function dayLabelV36(k){return k}',
 'function escapeHtml(x){return String(x).replaceAll("&","&amp;").replaceAll("<","&lt;")}',
 'function monthEventHTMLV36(e){return "<button data-master-event="+e.id+">"+e.title+"</button>"}',
 'function isWeekendV36(d){return d.getDay()===0||d.getDay()===6}'
 ].join('\n'));
 w.eval(month);
 const entries=Array.from({length:6},(_,i)=>({id:'e'+i,date:'2026-10-11',title:'Event '+i}));
 w.renderMonthV36(w.document.getElementById('host'),entries);
 const root=w.document;
 assert.equal(root.querySelectorAll('.v36-month-weekday').length,7);
 assert.ok(root.querySelectorAll('.v36-month-day').length>=35);
 const today=root.querySelector('.v36-month-day.today');
 assert.equal(today.dataset.masterDate,'2026-10-11');
 assert.equal(today.querySelector('.v36-month-date').getAttribute('aria-current'),'date');
 assert.match(today.querySelector('.v36-month-date').getAttribute('aria-label'),/6 scheduled items/);
 assert.equal(today.querySelectorAll('.om4-month-indicator').length,4);
 assert.equal(today.querySelectorAll('[data-master-event]').length,5);
 assert.ok(today.querySelector('.v36-more'));
 assert.ok(today.querySelector('[data-v36-add-date]'));
 dom.window.close();
});

test('Planner keeps drag and adds working touch-friendly scheduling affordances',()=>{
 for(const q of ['data-om4-plan-task','openBlockModal35(b.dataset.om4PlanTask)',
  'data-smart-task','data-drag-task','data-drop-date','id="om4-planner-calendar"',
  "window.switchView('master-calendar')",'aria-pressed=']){
  assert.ok(planner.includes(q),'Missing '+q);
 }
});

test('Agenda empty state and existing calendar CRUD remain functional',()=>{
 for(const q of ['om4-agenda-empty','Schedule an event','data-v36-add-date=',
  'function renderTimeViewV36','function renderMobileWeekV65',
  'function renderAgendaV36','function renderMonthV36','function renderWorkspaceV602']){
  assert.ok(source.includes(q),'Missing view '+q);
 }
 for(const fn of ['openCalendarPreviewV36','openTimeBlockModalV36','saveCalendarEventV36',
  'openCalendarCustomizerV36','bindDragV36']){
  assert.ok(handlers.includes('function '+fn+'('),'Missing action '+fn);
 }
});
