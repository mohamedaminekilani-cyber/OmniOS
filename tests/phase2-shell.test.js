import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const source=fs.readFileSync('app-parts/part-028.html','utf8');
const style=source.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1];
const shell=source.match(/<script id="omnios-phase2-shell-controls">([\s\S]*?)<\/script>/)?.[1];
const more=source.match(/<script id="omnios-remake-mobile-nav">([\s\S]*?)<\/script>/)?.[1];
assert.ok(style&&shell&&more,'Phase 2 scripts and switchable CSS must be available');
const begin=style.indexOf('OMNIOS PHASE 2 APPLICATION SHELL / v1');
const end=style.indexOf('END OMNIOS PHASE 2 APPLICATION SHELL / v1');
assert.ok(begin>=0&&end>begin,'Phase 2 shell must remain inside the switchable stylesheet');
const css=style.slice(begin,end);

function fixture(){
 const markup=[
 '<!doctype html><html data-theme="light" data-omni-ui="modern"><head><style id="omnios-unified-design-2026">'+style+'</style></head><body>',
 '<aside class="sidebar v101-sidebar"><div class="logo"><div class="v101-sidebar-profile"><span class="v101-sidebar-avatar"></span><div class="v101-sidebar-profile-copy"><strong>Profile</strong><span>OmniOS</span></div></div></div>',
 '<nav class="nav-menu">',
 '<section class="v101-nav-group" data-group="Plan"><button class="v101-nav-group-head" aria-expanded="true">Plan</button>',
 '<div class="v101-nav-group-body">',
 '<button type="button" class="nav-item active" data-view="dashboard"><span class="v101-nav-icon-wrap">◼</span><span class="v101-nav-label">Dashboard</span></button>',
 '<button type="button" class="nav-item" data-view="tasks"><span class="v101-nav-icon-wrap">✓</span><span class="v101-nav-label">Tasks</span></button>',
 '</div></section>',
 '<section class="v101-nav-group collapsed" data-group="Wellbeing"><button class="v101-nav-group-head" aria-expanded="false">Wellbeing</button>',
 '<div class="v101-nav-group-body">',
 '<button class="nav-item" data-view="habits"><span class="v101-nav-icon-wrap">◉</span><span class="v101-nav-label">Habits</span></button>',
 '</div></section></nav></aside>',
 '<nav class="mobile-nav omr-mobile-dock"><button data-mobile-view="dashboard">Home</button><button id="omr-mobile-more">More</button></nav>',
 '<main class="main-content"><header class="topbar"><h2 id="view-title">Dashboard</h2><span id="omni-unified-date">Sun Oct 11</span>',
 '<div class="topbar-actions"><button id="settings-topbar-btn">Settings</button><button id="global-add-btn">+ Quick Add</button></div></header>',
 '<div class="view-container"><section class="view active" id="view-dashboard"></section><section class="view" id="view-tasks"></section><section class="view" id="view-habits"></section></div></main>',
 '</body></html>'
 ].join('');
 const dom=new JSDOM(markup,{url:'https://example.test/OmniOS/',runScripts:'outside-only',pretendToBeVisual:true});
 const w=dom.window;
 w.switchView=id=>{const next=w.document.getElementById('view-'+id);if(!next)return false;
   w.document.querySelectorAll('.view').forEach(x=>x.classList.toggle('active',x===next));
   w.document.querySelectorAll('.nav-item').forEach(x=>x.classList.toggle('active',x.dataset.view===id));
   return true;};
 w.eval(more);w.eval(shell);w.document.dispatchEvent(new w.Event('DOMContentLoaded',{bubbles:true}));
 return {dom,w};
}
test('responsive application shell uses five readable mobile destinations and flat navigation',()=>{
 for(const marker of ['.sidebar.v101-sidebar','.v101-nav-group','.v101-sidebar-profile','.topbar',
   '.view-container','.mobile-nav.omr-mobile-dock','#omr-mobile-drawer','#om2-search-overlay']){
  assert.ok(css.includes(marker),'Missing '+marker);
 }
 assert.match(css,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
 assert.match(css,/env\(safe-area-inset-bottom/);
 assert.match(css,/min-height:43px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.doesNotMatch(shell,/new MutationObserver/);
 assert.ok(source.indexOf('END OMNIOS PHASE 1 FOUNDATION / v1') < source.indexOf('OMNIOS PHASE 2 APPLICATION SHELL / v1'));
});
test('desktop compact sidebar is reversible, keyboard-labeled and persisted separately from app data',()=>{
 const f=fixture(),w=f.w,button=w.document.getElementById('om2-sidebar-toggle');
 assert.ok(button);assert.equal(button.getAttribute('aria-label'),'Collapse sidebar');
 button.click();
 assert.equal(w.document.documentElement.classList.contains('om2-compact'),true);
 assert.equal(w.localStorage.getItem('omnios_phase2_sidebar_compact'),'1');
 assert.equal(button.getAttribute('aria-label'),'Expand sidebar');
 button.click();assert.equal(w.document.documentElement.classList.contains('om2-compact'),false);
 assert.equal(w.localStorage.getItem('omnios_phase2_sidebar_compact'),'0');
 f.dom.window.close();
});
test('search page palette filters real routes and opens selected page',()=>{
 const f=fixture(),w=f.w;
 w.document.getElementById('om2-search-toggle').click();
 const modal=w.document.getElementById('om2-search-overlay'),input=w.document.getElementById('om2-search-input');
 assert.equal(modal.hidden,false);
 assert.equal(w.document.activeElement,input);
 assert.equal(modal.querySelectorAll('.om2-search-result').length,3);
 input.value='hab';input.dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(modal.querySelectorAll('.om2-search-result').length,1);
 assert.equal(modal.querySelector('.om2-search-result').textContent.includes('Habits'),true);
 input.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
 assert.equal(w.document.getElementById('view-habits').classList.contains('active'),true);
 assert.equal(modal.hidden,true);
 f.dom.window.close();
});
test('page search supports shortcuts, escape, and Classic appearance',()=>{
 const f=fixture(),w=f.w;
 w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}));
 assert.equal(w.document.getElementById('om2-search-overlay').hidden,false);
 w.document.getElementById('om2-search-input').dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
 assert.equal(w.document.getElementById('om2-search-overlay').hidden,true);
 w.document.documentElement.dataset.omniUi='classic';
 w.OmniPhase2Shell.open();
 assert.equal(w.document.getElementById('om2-search-overlay').hidden,true);
 assert.ok(w.document.getElementById('om2-classic-guard'));
 f.dom.window.close();
});
test('mobile More sheet includes pages nested under upgraded grouped sidebar',()=>{
 const f=fixture(),w=f.w;
 const drawer=w.OmniRemakeNav.build();
 assert.equal(drawer.querySelectorAll('button[data-omr-go]').length,3);
 assert.deepEqual(Array.from(drawer.querySelectorAll('.omr-sheet-group')).map(x=>x.textContent),['Plan','Wellbeing']);
 assert.equal(drawer.querySelector('[data-omr-go="dashboard"]').getAttribute('aria-current'),'page');
 w.OmniRemakeNav.open();
 drawer.querySelector('[data-omr-go="habits"]').click();
 assert.equal(w.document.getElementById('view-habits').classList.contains('active'),true);
 assert.equal(drawer.hidden,true);
 f.dom.window.close();
});
