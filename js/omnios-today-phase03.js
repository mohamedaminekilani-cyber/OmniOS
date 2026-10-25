/* OmniOS Phase 03 — Today is the actionable command center; Dashboard retains analytics. */
(function(){
'use strict';
if(window.OmniToday03)return;
const state={expanded:false,sectionsExpanded:false,dashboardExpanded:false,inboxExpanded:false,scheduled:false,installed:false};
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
   const more=el('button','ux18-more-toggle','More for today');
   more.type='button';more.id='ux18-today-more';
   more.setAttribute('aria-label','Show additional Today sections');
   more.addEventListener('click',()=>{state.sectionsExpanded=!state.sectionsExpanded;renderToday()});
   bar.append(label,actions,toggle,more);
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
 const more=host.querySelector('#ux18-today-more');
 const secondary=['.om3-capture-panel','.omr-habits-panel','.om3-nutrition-panel'];
 const panels=secondary.map(selector=>host.querySelector(selector)).filter(Boolean);
 const signals=host.querySelector('.omr-signals-panel');
 const hasSignals=!!signals?.querySelector('.v35-row,.v58-signal-row');
 if(signals)panels.push(signals);
 const agenda=host.querySelector('.omr-agenda-panel');
 const agendaHasItems=!!agenda?.querySelector('.omr-timeline-row');
 if(agenda)agenda.classList.toggle('ux18-collapsed-section',!state.sectionsExpanded&&!agendaHasItems);
 panels.forEach(panel=>{
   const relevant=panel===signals&&hasSignals;
   panel.classList.toggle('ux18-collapsed-section',!state.sectionsExpanded&&!relevant);
 });
 const totals=host.querySelectorAll?.('.om3-daily-glance .omr-stat')||[];
 totals.forEach((stat,i)=>stat.classList.toggle('ux18-quiet-stat',!state.sectionsExpanded&&i>=2));
 if(more){
   more.textContent=state.sectionsExpanded?'Show fewer sections':'More for today';
   more.setAttribute('aria-expanded',String(state.sectionsExpanded));
   more.setAttribute('aria-label',state.sectionsExpanded?'Hide secondary Today sections':'Show additional Today sections');
 }
 // Existing ux03-focus-mode remains the single root state marker.
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
function renderInbox(){
 const host=$('#view-inbox');if(!host)return;
 const rows=[...host.querySelectorAll('.v35-list>.v35-row')];
 const head=host.querySelector('.v35-page-actions');
 if(!head)return;
 let button=host.querySelector('#ux18-inbox-more');
 if(rows.length<=5){
   button?.replaceWith();rows.forEach(row=>row.classList.remove('ux18-collapsed-section'));
   return;
 }
 if(!button){
   button=el('button','ux18-secondary-toggle','');
   button.id='ux18-inbox-more';button.type='button';
   head.appendChild(button);
   button.addEventListener('click',()=>{state.inboxExpanded=!state.inboxExpanded;renderInbox()});
 }
 rows.forEach((row,i)=>row.classList.toggle('ux18-collapsed-section',!state.inboxExpanded&&i>=5));
 button.textContent=state.inboxExpanded?'Show fewer captures':'Show all '+rows.length+' captures';
 button.setAttribute('aria-expanded',String(state.inboxExpanded));
 button.setAttribute('aria-label',state.inboxExpanded?'Collapse Inbox to five captures':'Show all '+rows.length+' captured items');
}
function decorateDashboard(){
 const host=$('#view-dashboard');if(!host)return;
 const banner=host.querySelector('#ux03-dashboard-return');if(!banner)return;
 const container=host.querySelector('#v55-dashboard-widgets,.dashboard-grid,.dashboard-widgets');
 const entries=container?[...container.children].filter(node=>node.nodeType===1&&!['SCRIPT','STYLE'].includes(node.tagName)):[];
 let toggle=host.querySelector('#ux18-dashboard-more');
 if(entries.length<=3){toggle?.replaceWith();entries.forEach(node=>node.classList.remove('ux18-collapsed-section'));return}
 if(!toggle){
   toggle=el('button','ux18-secondary-toggle','');
   toggle.id='ux18-dashboard-more';toggle.type='button';
   toggle.addEventListener('click',()=>{state.dashboardExpanded=!state.dashboardExpanded;decorateDashboard()});
   banner.appendChild(toggle);
 }
 entries.forEach((node,i)=>node.classList.toggle('ux18-collapsed-section',!state.dashboardExpanded&&i>=3));
 toggle.textContent=state.dashboardExpanded?'Show fewer widgets':'View all insights ('+entries.length+')';
 toggle.setAttribute('aria-expanded',String(state.dashboardExpanded));
 toggle.setAttribute('aria-label',state.dashboardExpanded?'Collapse Dashboard insights':'Expand Dashboard to '+entries.length+' insights');
}
function refresh(){
 state.scheduled=false;
 renderToday();renderDashboard();decorateDashboard();renderInbox();
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
     if(args[0]==='today'||args[0]==='dashboard'||args[0]==='inbox'){
       schedule();
       requestAnimationFrame(schedule);
       if(args[0]==='dashboard')setTimeout(schedule,120);
       if(args[0]==='inbox')setTimeout(schedule,120);
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
   if(active==='view-today'||active==='view-dashboard'||active==='view-inbox')schedule();
 });
 schedule();
}
window.OmniToday03={showInsights:()=>{state.expanded=true;renderToday()},hideInsights:()=>{state.expanded=false;renderToday()},showSections:()=>{state.sectionsExpanded=true;renderToday()},hideSections:()=>{state.sectionsExpanded=false;renderToday()},get expanded(){return state.expanded},refresh:schedule};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
