/* OmniOS UX Phase 07 — consistent module controls, preserving original handlers. */
(function(){
'use strict';
if(window.OmniModules07)return;
const MODULES=[
  {id:'workout',tab:'.workout-tabs',button:'[data-workout-tab]',label:'Workout sections'},
  {id:'diet',tab:'.nut-tabs',button:'[data-nut-tab]',label:'Nutrition sections'},
  {id:'habits',tab:'.habit-toolbar .toolbar-group',button:'[data-habitview]',label:'Habit history views'}
];
const state={installed:false,pending:false};
function updateGroup(spec){
  const root=document.getElementById('view-'+spec.id);
  if(!root)return;
  const group=root.querySelector(spec.tab);
  if(!group)return;
  group.setAttribute('role','group');
  group.setAttribute('aria-label',spec.label);
  group.querySelectorAll(spec.button).forEach(b=>{
    const active=b.classList.contains('active');
    b.setAttribute('aria-pressed',String(active));
    if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.textContent.trim());
  });
}
function decorate(){
 state.pending=false;
 MODULES.forEach(updateGroup);
 const workout=document.getElementById('view-workout');
 const start=workout?.querySelector('#workout-start-btn');
 if(start)start.setAttribute('aria-label','Start a workout session');
 const finance=document.getElementById('view-budget');
 const month=finance?.querySelector('.finance-period-nav');
 if(month){month.setAttribute('role','group');month.setAttribute('aria-label','Finance month navigation');}
 const notes=document.getElementById('view-notes');
 const toolbar=notes?.querySelector('.notes-toolbar');
 if(toolbar)toolbar.setAttribute('role','search');
 const search=notes?.querySelector('#notes-search');
 if(search)search.setAttribute('aria-label','Search notes');
}
function refresh(){
 if(state.pending)return;
 state.pending=true;queueMicrotask(decorate);
}
function install(){
 if(state.installed)return;
 state.installed=true;
 // Nutrition replaces its own root children; observe only that root, never all descendants.
 const diet=document.getElementById('view-diet');
 if(diet)new MutationObserver(refresh).observe(diet,{childList:true});
 document.addEventListener('click',e=>{
   if(e.target.closest?.('[data-view],[data-ux02-view],[data-habitview],[data-workout-tab],[data-nut-tab]'))requestAnimationFrame(refresh);
 },false);
 window.addEventListener('hashchange',refresh);
 refresh();
}
window.OmniModules07={refresh,views:MODULES.map(m=>m.id).concat(['budget','notes'])};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
