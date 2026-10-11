import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const tasks=fs.readFileSync('app-parts/part-001.html','utf8');
const life=fs.readFileSync('app-parts/part-004.html','utf8');
const finance=fs.readFileSync('app-parts/part-005.html','utf8');
const organize=fs.readFileSync('app-parts/part-006.html','utf8');
const layers=fs.readFileSync('app-parts/part-028.html','utf8');
const css=layers.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1]||'';
const phase=css.slice(css.indexOf('OMNIOS PHASE 6 / REMAINING MODULES / v1'));

test('Phase 6 follows Phase 5 inside one reversible UI stylesheet',()=>{
 assert.ok(css.indexOf('OMNIOS PHASE 6 / REMAINING MODULES / v1')>css.indexOf('END OMNIOS PHASE 5 / HABITS + ROUTINE + WORKOUT / v1'));
 assert.ok(phase.includes('END OMNIOS PHASE 6 / REMAINING MODULES / v1'));
 assert.ok(layers.includes("css.disabled=mode==='classic'"));
 assert.doesNotMatch(phase,/MutationObserver|localStorage|fetch\(|@import|url\(/);
 assert.doesNotMatch(phase,/linear-gradient|radial-gradient|backdrop-filter/);
 assert.match(phase,/prefers-reduced-motion:reduce/);
 assert.match(phase,/focus-visible/);
});

test('Tasks zero-state offers a working creation action and announces active view',()=>{
 const start=tasks.indexOf('function renderTasks() {');
 const end=tasks.indexOf('function attachCardClicks()',start);
 assert.ok(start>=0&&end>start);
 const render=tasks.slice(start,end);
 const dom=new JSDOM('<!doctype html><main id="view-tasks"><button id="omx-task-quick-add">Create</button><button data-taskview="list"></button><button data-taskview="kanban"></button><div id="tasks-content"></div></main>',{runScripts:'outside-only'});
 const w=dom.window;w.eval('let currentTaskView="list"; function getFilteredEntries(){return []};'+render);
 let clicks=0;w.document.querySelector('#omx-task-quick-add').addEventListener('click',()=>clicks++);
 w.renderTasks();
 assert.equal(w.document.querySelector('[data-taskview="list"]').getAttribute('aria-pressed'),'true');
 assert.equal(w.document.querySelector('[data-taskview="kanban"]').getAttribute('aria-pressed'),'false');
 const btn=w.document.getElementById('om6-empty-task');assert.ok(btn);btn.click();assert.equal(clicks,1);
 dom.window.close();
});

test('Inbox capture and process actions remain wired and empty process is unavailable',()=>{
 const start=life.indexOf('function renderInbox35(){'),end=life.indexOf('function triageInbox35(',start);
 const src=life.slice(start,end);
 for(const x of ['om6-inbox-count','v35-inbox-add','v35-inbox-input','Capture to Inbox','data-v35-triage','v35-inbox-process','captureInbox35(i.value)','triageInbox35(x.id)','disabled aria-disabled'])assert.ok(src.includes(x),x);
});

test('Projects can be opened with mouse, Enter, and Space while keeping editor and tabs',()=>{
 const start=life.indexOf('function renderProjects35(){'),end=life.indexOf('function openProjectModal35(',start);
 const src=life.slice(start,end);
 for(const x of ['data-v35-project-tab','aria-pressed=','data-v35-project','tabindex="0"','role="button"','onkeydown=e=>','openProjectDetail35','openProjectModal35'])assert.ok(src.includes(x),x);
});

test('Finance and Reminders provide accessible tab state without changing data behavior',()=>{
 const f=finance.slice(finance.indexOf('function topShell38(){'),finance.indexOf('window.renderFinanceV38=',finance.indexOf('function topShell38(){')));
 for(const x of ['aria-pressed="\${tab===k}"','aria-label="Previous finance month"','aria-label="Next finance month"','openFinanceTransactionV38','openTransferV38','renderTransactions38','renderBudgetTab38'])assert.ok(f.includes(x),x);
 const r=organize.slice(organize.indexOf('function renderReminders40(){'),organize.indexOf('function ',organize.indexOf('function renderReminders40(){')+12));
 for(const x of ['aria-pressed="\${u.scope===k}"','aria-label="Search reminders"','id="org-rem-new"','data-rem-scope','org-rem-item'])assert.ok(r.includes(x),x);
});

test('Remaining modules receive flat surfaces and responsive bounded layouts',()=>{
 const selectorFamilies=['#view-tasks','#view-inbox','#view-projects','#view-data-center',
 '#view-budget','#view-diet','#view-notes','#view-reminders','#view-grocery',
 '#view-pantry','#view-wishlist','#view-people','#view-life-hub','#view-organize',
 '#view-bible','#view-settings','#view-sync','#view-studio','#view-goals'];
 for(const selector of selectorFamilies)assert.ok(phase.includes(selector),'Missing module '+selector);
 for(const item of ['kanban-board','v35-project-grid','v38-finance-head','v38-fin-tabs',
 'diet-calendar-wrap','org-rail','org-rem-item','settings-row','@media(max-width:760px)',
 '@media(max-width:420px)','min-height:44px','box-shadow:none!important'])assert.ok(phase.includes(item),item);
});
