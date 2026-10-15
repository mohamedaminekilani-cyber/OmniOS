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
function setAttr(node,name,value){
 if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
}
function updateGroup(spec){
  const root=document.getElementById('view-'+spec.id);
  if(!root)return;
  const group=root.querySelector(spec.tab);
  if(!group)return;
  setAttr(group,'role','group');
  setAttr(group,'aria-label',spec.label);
  group.querySelectorAll(spec.button).forEach(b=>{
    const active=b.classList.contains('active');
    setAttr(b,'aria-pressed',String(active));
    if(!b.getAttribute('aria-label'))setAttr(b,'aria-label',b.textContent.trim());
  });
}
function decorate(){
 state.pending=false;
 MODULES.forEach(updateGroup);
 const workout=document.getElementById('view-workout');
 const start=workout?.querySelector('#workout-start-btn');
 setAttr(start,'aria-label','Start a workout session');
 const finance=document.getElementById('view-budget');
 const month=finance?.querySelector('.v38-month-nav,.finance-period-nav');
 if(month){setAttr(month,'role','group');setAttr(month,'aria-label','Finance month navigation');}
 const finTabs=finance?.querySelector('.v38-fin-tabs');
 if(finTabs){setAttr(finTabs,'role','group');setAttr(finTabs,'aria-label','Finance sections');}
 const notes=document.getElementById('view-notes');
 const toolbar=notes?.querySelector('.org-toolbar,.notes-toolbar');
 setAttr(toolbar,'role','search');
 const search=notes?.querySelector('#org-note-search,#notes-search');
 setAttr(search,'aria-label','Search notes');
 // Notes V40 uses .org-seg (not .org-segmented). Keep the original layout handlers.
 const views=notes?.querySelector('.org-toolbar .org-seg');
 if(views){
   setAttr(views,'role','group');
   setAttr(views,'aria-label','Notes layout');
   views.querySelectorAll('[data-org-view]').forEach(button=>{
     setAttr(button,'aria-pressed',String(button.classList.contains('active')));
   });
 }
 const collections=notes?.querySelector('.org-rail');
 if(collections){
   setAttr(collections,'aria-label','Note collections');
   collections.querySelectorAll('[data-note-scope]').forEach(button=>{
     setAttr(button,'aria-pressed',String(button.classList.contains('active')));
   });
 }
}
function refresh(){
 if(state.pending)return;
 state.pending=true;queueMicrotask(decorate);
}
function install(){
 if(state.installed)return;
 state.installed=true;
 // Nutrition replaces its own root children; observe only that root, never all descendants.
 const observer=new MutationObserver(refresh);
 const diet=document.getElementById('view-diet');
 if(diet)observer.observe(diet,{childList:true});
 // One observer covers three direct-child containers; no subtree observation.
 for(const id of ['budget','notes']){
   const root=document.getElementById('view-'+id);
   if(root)observer.observe(root,{childList:true});
 }
 document.addEventListener('click',e=>{
   if(e.target.closest?.('[data-view],[data-ux02-view],[data-habitview],[data-workout-tab],[data-nut-tab],[data-org-view],[data-note-scope],[data-v38-tab]'))requestAnimationFrame(refresh);
 },false);
 window.addEventListener('hashchange',refresh);
 refresh();
}
window.OmniModules07={refresh,views:MODULES.map(m=>m.id).concat(['budget','notes'])};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
