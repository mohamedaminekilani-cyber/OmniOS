/* OmniOS UX Phase 05: non-destructive calendar stability and responsive UX. */
(function(){
'use strict';
if(window.OmniCalendar05)return;
const ROOT='#view-master-calendar';
const $=s=>document.querySelector(s);
const state={installed:false,scheduled:false,framePending:false,lastToolbar:null,lastMode:'',lastMobile:null};
function setAttr(node,name,value){
 if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
}
function setStyle(node,name,value,priority){
 if(!node)return;
 if(node.style.getPropertyValue(name)!==value||node.style.getPropertyPriority(name)!==priority)
   node.style.setProperty(name,value,priority);
}
function mobile(){return window.matchMedia('(max-width:760px)').matches}
function needsLateRepair(){
 const host=$('#master-calendar-content');
 if(!host||!isActive())return false;
 const toolbar=host.querySelector('.v36-cal-toolbar');
 if(!toolbar)return false;
 const onPhone=mobile(),mode=currentMode();
 if(toolbar!==state.lastToolbar||mode!==state.lastMode||onPhone!==state.lastMobile)return true;
 if(!onPhone)return false;
 const center=toolbar.querySelector('.v36-cal-center');
 if(center&&(center.hidden||center.getAttribute('aria-hidden')==='true'||center.style.getPropertyValue('display')!=='flex'))return true;
 return [...toolbar.querySelectorAll('[data-v36-mode]')].some(b=>
   b.hidden||b.style.getPropertyValue('display')!=='inline-flex'||b.getAttribute('aria-pressed')!==String(b.dataset.v36Mode===mode));
}
function shiftMonthClamped(date,delta){
 const d=new Date(date);
 if(!Number.isFinite(d.getTime()))return null;
 const day=d.getDate();
 d.setDate(1);d.setMonth(d.getMonth()+delta);
 d.setDate(Math.min(day,new Date(d.getFullYear(),d.getMonth()+1,0).getDate()));
 return d;
}
function currentDate(){
 try{return typeof masterCalendarDate!=='undefined'?new Date(masterCalendarDate):null}
 catch(_){return null}
}
function currentMode(){
 try{return typeof masterCalendarMode!=='undefined'?String(masterCalendarMode):''}
 catch(_){return ''}
}
function updateDate(next){
 if(!next||!Number.isFinite(next.getTime()))return false;
 try{
   if(typeof masterCalendarDate==='undefined'||typeof window.renderMasterCalendar!=='function')return false;
   masterCalendarDate=next;
   window.renderMasterCalendar();
   return true;
 }catch(e){console.warn('Calendar navigation failed',e);return false}
}
function isActive(){return !!$(ROOT+'.active')}
function decorate(){
 state.scheduled=false;
 const host=$('#master-calendar-content');
 if(!host||!isActive())return;
 const toolbar=host.querySelector('.v36-cal-toolbar');
 if(!toolbar)return;
 const onPhone=mobile();
 state.lastToolbar=toolbar;
 state.lastMode=currentMode();
 state.lastMobile=onPhone;
 // Older mobile presentation scripts suppress the mode row after the base
 // renderer runs. Reuse that same row instead of introducing duplicate controls.
 const center=toolbar.querySelector('.v36-cal-center');
 if(center){
   if(onPhone){
     if(center.hidden)center.hidden=false;
     if(center.hasAttribute('aria-hidden'))center.removeAttribute('aria-hidden');
     setStyle(center,'display','flex','important');
     center.dataset.ux05Restored='1';
   }else if(center.dataset.ux05Restored==='1'){
     if(center.style.getPropertyValue('display'))center.style.removeProperty('display');
     delete center.dataset.ux05Restored;
   }
 }
 const mode=currentMode();
 const buttons=[...toolbar.querySelectorAll('[data-v36-mode]')];
 buttons.forEach(b=>{
   const selected=b.dataset.v36Mode===mode;
   setAttr(b,'aria-pressed',String(selected));
   setAttr(b,'aria-label',b.textContent.trim()+' calendar view');
   if(onPhone){
     if(b.hidden)b.hidden=false;
     setStyle(b,'display','inline-flex','important');
     b.dataset.ux05ModeRestored='1';
   }else if(b.dataset.ux05ModeRestored==='1'){
     if(b.style.getPropertyValue('display'))b.style.removeProperty('display');
     delete b.dataset.ux05ModeRestored;
   }
 });
 const grid=host.querySelector('.v36-month-grid');
 if(grid){
   setAttr(grid,'role','grid');
   setAttr(grid,'aria-label','Monthly calendar');
   const days=[...grid.querySelectorAll('.v36-month-day')];
   days.forEach(day=>{
     setAttr(day,'role','gridcell');
     if(day.classList.contains('today'))setAttr(day,'aria-current','date');
     else if(day.hasAttribute('aria-current'))day.removeAttribute('aria-current');
   });
   const status=host.querySelector('#ux05-calendar-empty');
   const count=grid.querySelectorAll('.v36-month-event').length;
   if(count===0&&!status){
     const p=document.createElement('p');p.id='ux05-calendar-empty';p.className='ux05-empty-hint';
     p.textContent='No visible items this month. Try different filters or add an event.';
     grid.after(p);
   }else if(count>0&&status)status.remove();
 }
 setAttr(toolbar,'aria-label','Calendar navigation and view options');
 const period=toolbar.querySelector('.v36-cal-period');
 setAttr(period,'aria-live','polite');
}
function schedule(){
 if(!state.scheduled){
   state.scheduled=true;
   queueMicrotask(decorate);
 }
 if(!state.framePending){
   state.framePending=true;
   requestAnimationFrame(()=>{
     state.framePending=false;
     // Legacy layout hooks may modify the toolbar after our microtask.
     // Read only its current identity/selection and repair if necessary.
     if(needsLateRepair())decorate();
   });
 }
}
function onClick(e){
 const b=e.target.closest?.(ROOT+' #v36-cal-prev,'+ROOT+' #v36-cal-next,'+ROOT+' [data-v602-mini-nav]');
 if(!b||!isActive())return;
 // The original calendar uses Date.setMonth(currentMonth + delta) and can skip
 // February from the 31st. Clamp the day before changing month instead.
 if(b.matches('[data-v602-mini-nav]')||currentMode()==='month'){
   const delta=b.matches('#v36-cal-prev')?-1:b.matches('#v36-cal-next')?1:Number(b.dataset.v602MiniNav);
   if(!Number.isInteger(delta)||Math.abs(delta)!==1)return;
   const date=currentDate(),next=date&&shiftMonthClamped(date,delta);
   if(next&&updateDate(next)){
     e.preventDefault();e.stopImmediatePropagation();
   }
 }
}
function onKeys(e){
 if(!isActive()||!e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;
 const targets={ArrowLeft:'#v36-cal-prev',ArrowRight:'#v36-cal-next',KeyT:'#v36-cal-today'};
 const target=targets[e.code];
 if(!target)return;
 const b=$(ROOT+' '+target);
 if(b){e.preventDefault();b.click();}
}
function install(){
 if(state.installed)return;
 const host=$('#master-calendar-content');
 if(!host)return;
 state.installed=true;
 document.addEventListener('click',onClick,true);
 document.addEventListener('keydown',onKeys);
 window.addEventListener('resize',schedule,{passive:true});
 new MutationObserver(schedule).observe(host,{childList:true});
 document.addEventListener('click',e=>{
   if(e.target.closest?.('[data-view="master-calendar"],[data-mobile-view="master-calendar"],[data-ux02-view="master-calendar"]'))queueMicrotask(schedule);
 },false);
 schedule();
}
window.OmniCalendar05={clampMonth:shiftMonthClamped,refresh:schedule,mode:currentMode};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
