import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const shell=readFileSync('app-parts/part-001.html','utf8');
const today=readFileSync('app-parts/part-004.html','utf8');
const dashboard=readFileSync('app-parts/part-006.html','utf8');
const visual=readFileSync('app-parts/part-028.html','utf8');
const theme=visual.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1];
assert.ok(theme,'All redesign CSS must reside in the switchable OmniOS design layer');
function luminance(hex){
 const rgb=hex.match(/[0-9a-f]{2}/gi).map(n=>parseInt(n,16)/255);
 const [r,g,b]=rgb.map(c=>c<=.04045?c/12.92:((c+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
function contrast(a,b){
 const x=luminance(a),y=luminance(b);
 return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);
}
test('brand colors keep AA contrast for normal labels and actions',()=>{
 for(const c of ['#101114','#EEF0F2','#2547E8','#5F31C4','#C6F04A','#55606D']) assert.ok(theme.includes(c),c);
 for(const [a,b] of [
  ['#FFFFFF','#2547E8'],['#FFFFFF','#5F31C4'],['#101114','#C6F04A'],
  ['#101114','#EEF0F2'],['#55606D','#EEF0F2'],['#B7C0CE','#101114']
 ])assert.ok(contrast(a,b)>=4.5,a+' on '+b+' '+contrast(a,b).toFixed(2)+':1');
 assert.ok(contrast('#C6F04A','#EEF0F2')<4.5,'lime-on-Mist must never be used as text');
});
test('core functional page headers and dashboard action hierarchy are real markup',()=>{
 for(const id of ['view-tasks','view-habits','view-workout','view-notes']){
  assert.ok(shell.includes('id="'+id+'"'),'missing '+id);
 }
 for(const id of ['omx-task-quick-add','omx-habit-switch','omx-page-heading']){
  assert.ok(shell.includes(id),'missing '+id);
 }
 assert.match(shell,/omx-task-quick-add'\)\?\.addEventListener\('click',\(\)=>\{resetTaskForm\(\);openModal\('task-modal'\)\}/);
 assert.match(today,/omx-calendar-intro/);
 assert.match(today,/omx-schedule-status/);
 assert.match(dashboard,/class="omx-next-focus"/);
 assert.match(dashboard,/class="omx-quick-actions"/);
 assert.match(dashboard,/data-v43-open="master-calendar"/);
 assert.match(dashboard,/nextFocusTask43/);
});
test('remake covers every major module at mobile and desktop breakpoints',()=>{
 for(const selector of ['#view-dashboard','#view-tasks','#view-master-calendar','#view-habits','#view-workout','#view-budget','#view-notes','#view-life-hub','#view-focus','#view-settings']){
  assert.ok(theme.includes(selector),selector);
 }
 for(const token of ['.omx-next-focus','.omx-page-heading','.omx-tasks-toolbar','.omx-calendar-intro','.omx-habit-switch','grid-template-columns:repeat(4,minmax(0,1fr))','max-width:1150px','max-width:760px','max-width:380px','safe-area-inset-bottom','prefers-reduced-motion:reduce']){
  assert.ok(theme.includes(token),token);
 }
});
test('no new image dependencies, app state mutation or replacement of workout tracking',()=>{
 const home=readFileSync('js/home-workout.js','utf8');
 assert.doesNotMatch(home, /<img|@bryllim|cdn\.jsdelivr/);
 const remake=theme.slice(theme.indexOf('OMNIOS PRODUCT REMAKE / v2'));
 assert.ok(remake.includes('box-shadow:none!important'));
 assert.ok(remake.includes('background:var(--omx-card)'));
 assert.doesNotMatch(remake,/MutationObserver|localStorage\.setItem|fetch\(/);
 const classic=visual.match(/<script id="omnios-unified-2026-controls">([\s\S]*?)<\/script>/)?.[1];
 assert.ok(classic&&classic.includes("css.disabled=mode==='classic'"),'Classic fallback still functional');
});
