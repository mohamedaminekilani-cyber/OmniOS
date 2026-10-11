import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const today=fs.readFileSync('app-parts/part-004.html','utf8');
const dashboard=fs.readFileSync('app-parts/part-006.html','utf8');
const styles=fs.readFileSync('app-parts/part-028.html','utf8');
const spec=fs.readFileSync('design-system/PHASE3.md','utf8');

function renderSource(content,start,end){
 const a=content.indexOf(start),b=content.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'missing complete renderer '+start);
 return content.slice(a,b);
}
const todaySrc=renderSource(today,'function renderToday35(){','function todaySignals35()');
const dashSrc=renderSource(dashboard,'function renderDashboard43(){','function persist43()');
const css=styles.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1]||'';

test('Phase 3 is stacked after Phase 1 and Phase 2 inside reversible stylesheet',()=>{
 const p1=css.indexOf('OMNIOS PHASE 1 FOUNDATION / v1');
 const p2=css.indexOf('OMNIOS PHASE 2 APPLICATION SHELL / v1');
 const p3=css.indexOf('OMNIOS PHASE 3 / DAILY WORKSPACE AND DASHBOARD / v1');
 assert.ok(p1>=0&&p2>p1&&p3>p2);
 assert.match(spec,/backup\/omnios-before-phase3-2026-10-11/);
 assert.doesNotMatch(css.slice(p3),/MutationObserver|fetch\(/);
});
test('Today uses a clear daily hierarchy with exactly one capture/agenda/habits control',()=>{
 for(const term of [
  'om3-daily-glance','om3-today-grid','om3-priority-panel','omr-agenda-panel',
  'om3-capture-panel','om3-habit-progress','om3-nutrition-panel','omr-signals-panel',
  'v35-today-capture-btn','v35-today-review','v35-today-add']){
  assert.ok(todaySrc.includes(term),'Today missing '+term);
 }
 for(const term of ['id="v35-today-capture"','id="v35-today-capture-btn"','class="omr-priority-list"']){
  assert.equal(todaySrc.split(term).length-1,1,'duplicated Today control '+term);
 }
 assert.match(todaySrc,/captureInbox35\(input\.value\)/);
 assert.match(todaySrc,/window\.saveState\(\);renderToday35\(\)/);
 assert.match(todaySrc,/aria-valuenow/);
});
test('Dashboard derives priorities from live tasks and retains scope, period and navigation',()=>{
 for(const term of ['priorityTasks43','priorityRows43','om3-dashboard-focus','om3-priority-list',
  'data-om3-task','data-v43-open="today"','v43-dash-period','data-v43-scope',
  'v431-board','v431-kpis']){
  assert.ok(dashSrc.includes(term),'Dashboard missing '+term);
 }
 assert.match(dashSrc,/arr\(state\.entries\)\.filter\(t=>!done43\(t\)\)/);
 assert.match(dashSrc, /\.slice\(0,3\)/);
 assert.match(dashSrc,/showPowerSidebarFor\('task',id\)/);
 assert.match(dashSrc,/persist43\(\);renderDashboard43\(\)/);
});
test('compact responsive panels work with dark and light tokens',()=>{
 const s=css.slice(css.indexOf('OMNIOS PHASE 3 / DAILY WORKSPACE'));
 for(const x of ['om3-daily-glance','om3-today-grid','om3-dashboard-focus',
  'om3-priority-item','om3-nutrition-row','om3-capture-panel']){
  assert.ok(s.includes(x),'Missing CSS '+x);
 }
 assert.match(s,/var\(--ds-surface\)/);
 assert.match(s,/var\(--ds-text-muted\)/);
 assert.match(s,/var\(--ds-success\)/);
 assert.match(s,/@media\(max-width:1050px\)/);
 assert.match(s,/@media\(max-width:760px\)/);
 assert.match(s,/@media\(max-width:390px\)/);
 assert.match(s,/min-height:44px/);
 assert.match(s,/box-shadow:none/);
});
