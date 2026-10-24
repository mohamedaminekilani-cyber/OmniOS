/* OmniOS Phase 03 — Today is the actionable command center; Dashboard retains analytics. */
(function(){
'use strict';
if(window.OmniToday03)return;
const state={expanded:false,scheduled:false,installed:false};
const $=s=>document.querySelector(s);
const el=(tag,cls,txt)=>{const node=document.createElement(tag);node.className=cls;if(txt!==undefined)node.textContent=txt;return node};
const go=view=>{if(typeof window.switchView==='function')window.switchView(view)};
function button(label,action){
 const b=el('button','ux03-command',label);b.type='button';
 b.addEventListener('click',()=>go(action));return b;
}
function renderToday(){
 const host=$('#view-today');if(!host)return;
 host.classList.toggle('ux03-focus-mode',!state.expanded);
 if(!host.querySelector('#ux03-today-controls')){
   const bar=el('section','ux03-command-bar');bar.id='ux03-today-controls';
   bar.setAttribute('aria-label','Today commands');
   const label=el('div','ux03-command-intro');
   label.append(el('strong','ux03-command-heading','Your day, at a glance'),
     el('span','ux03-command-description','Act here. Review broader trends in Insights.'));
   const actions=el('nav','ux03-command-actions');
   actions.setAttribute('aria-label','Today shortcuts');
   actions.append(button('Tasks','tasks'),button('Calendar','master-calendar'),button('Inbox','inbox'),button('Insights','dashboard'));
   const toggle=el('button','ux03-insights-toggle');toggle.type='button';
   toggle.id='ux03-connected-toggle';toggle.setAttribute('aria-controls','v58-today-intelligence');
   toggle.addEventListener('click',()=>{
     state.expanded=!state.expanded;renderToday();
   });
   bar.append(label,actions,toggle);
   const hero=host.querySelector('.omr-day-hero');
   if(hero)hero.after(bar);
   else host.appendChild(bar);
 }
 const bar=host.querySelector('#ux03-today-controls'),hero=host.querySelector('.omr-day-hero');
 if(hero&&bar&&bar.previousElementSibling!==hero)hero.after(bar);
 const toggle=host.querySelector('#ux03-connected-toggle');
 if(toggle){
   toggle.textContent=state.expanded?'Hide connected insights':'Show connected insights';
   toggle.setAttribute('aria-expanded',String(state.expanded));
 }
 // v58 is still rendered by legacy modules. Put the attention summary after
 // the actual Today snapshot instead of ahead of the greeting. Move the node
 // rather than re-rendering it so original buttons and listeners survive.
 const glance=host.querySelector('.om3-daily-glance');
 const attention=host.querySelector('#v58-attention');
 if(glance&&attention&&glance.nextElementSibling!==attention)glance.after(attention);
 const extra=host.querySelector('#v58-today-intelligence');
 if(extra)extra.setAttribute('aria-label','Connected insights: projects, Bible, supply and wellbeing');
}
function renderDashboard(){
 const host=$('#view-dashboard');if(!host)return;
 if(host.querySelector('#ux03-dashboard-return'))return;
 const banner=el('div','ux03-dashboard-entry');banner.id='ux03-dashboard-return';
 const copy=el('div','ux03-dashboard-copy');
 copy.append(el('strong','ux03-dashboard-heading','Insights & trends'),
   el('span','ux03-dashboard-description','Your deeper overview; use Today for action and priorities.'));
 const back=button('← Back to Today','today');
 back.classList.add('ux03-return-button');banner.append(copy,back);host.prepend(banner);
}
function refresh(){
 state.scheduled=false;
 renderToday();renderDashboard();
}
function schedule(){
 if(state.scheduled)return;
 state.scheduled=true;queueMicrotask(refresh);
}
function install(){
 if(state.installed)return;
 const today=$('#view-today'),dashboard=$('#view-dashboard');
 if(!today||!dashboard)return;
 state.installed=true;
 // Only direct child changes: rerendered views replace their children. Avoid subtree observers.
 new MutationObserver(schedule).observe(today,{childList:true});
 new MutationObserver(schedule).observe(dashboard,{childList:true});
 // Legacy dashboard renderers can run in deferred tasks after switchView().
 // Reinstate only the lightweight command/header UI once those renders settle.
 const previousSwitch=window.switchView;
 if(typeof previousSwitch==='function'&&!previousSwitch.__ux03){
   const wrapped=function(...args){
     const result=previousSwitch.apply(this,args);
     // Other modules own their own rendering. Do not touch Today's controls
     // on unrelated navigation; root observers still handle genuine rebuilds.
     if(args[0]==='today'||args[0]==='dashboard'){
       schedule();
       requestAnimationFrame(schedule);
       if(args[0]==='dashboard')setTimeout(schedule,120);
     }
     return result;
   };
   wrapped.__ux03=true;
   window.switchView=wrapped;
 }
 window.addEventListener('hashchange',()=>{
   // Deep links to Today or Dashboard still restore controls. Hash changes
   // while viewing another module must not trigger unrelated work.
   const active=document.querySelector('.view.active[id^="view-"]')?.id;
   if(active==='view-today'||active==='view-dashboard')schedule();
 });
 schedule();
}
window.OmniToday03={showInsights:()=>{state.expanded=true;renderToday()},hideInsights:()=>{state.expanded=false;renderToday()},get expanded(){return state.expanded},refresh:schedule};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
