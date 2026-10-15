/* OmniOS UX Phase 06 — One Life Hub, existing v43 data and record editor authority. */
(function(){
'use strict';
if(window.OmniLife06)return;
const HOST_ID='view-life-hub';
const DOMAINS=['overview','people','health','home','documents','admin','learning','travel','money','journal','automations'];
const MODULES=[
  {id:'workout',label:'Workout',hint:'Sessions & progress'},
  {id:'diet',label:'Nutrition',hint:'Meals & logging'},
  {id:'budget',label:'Finance',hint:'Budget & expenses'},
  {id:'grocery',label:'Grocery',hint:'Shopping list'},
  {id:'pantry',label:'Pantry',hint:'Stock & supplies'},
  {id:'wishlist',label:'Wishlist',hint:'Planned purchases'}
];
const state06={installed:false,queued:false,contentTarget:null,contentObserver:null};
function observeContent(content){
 // The V43 renderer can replace its content container. Disconnect the old
 // observer before watching the replacement; never accumulate detached roots.
 if(content===state06.contentTarget)return;
 state06.contentObserver?.disconnect();
 state06.contentObserver=null;
 state06.contentTarget=content||null;
 if(content){
   const observer=new MutationObserver(schedule);
   observer.observe(content,{childList:true});
   state06.contentObserver=observer;
 }
}
function setAttr(node,name,value){
 if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
}
const host=()=>document.getElementById(HOST_ID);
function existing(id){return !!document.getElementById('view-'+id)}
function route(id){
 if(!existing(id)||typeof window.switchView!=='function')return false;
 return window.switchView(id)!==false;
}
function activateDomain(id){
 const tab=host()?.querySelector('.v43-life-rail [data-v43-life="'+id+'"]');
 if(tab){tab.click();return true}
 const select=host()?.querySelector('#v43-life-select');
 if(!select)return false;
 select.value=id;
 select.dispatchEvent(new Event('change',{bubbles:true}));
 return true;
}
function domain(id){
 if(!DOMAINS.includes(id))return false;
 if(host()?.classList.contains('active'))return activateDomain(id);
 if(!route('life-hub'))return false;
 // The original v43 switchView schedules its renderer; run after that render.
 setTimeout(()=>activateDomain(id),60);
 return true;
}
function createLinks(){
 const nav=document.createElement('nav');
 nav.id='ux06-life-links';nav.className='ux06-life-links';
 nav.setAttribute('aria-label','Related life modules');
 const heading=document.createElement('div');heading.className='ux06-links-intro';
 const h=document.createElement('strong');h.textContent='Your everyday life';
 const p=document.createElement('span');p.textContent='Jump to the module you need. Life Hub keeps your records here.';
 heading.append(h,p);nav.appendChild(heading);
 const grid=document.createElement('div');grid.className='ux06-links-grid';
 MODULES.filter(m=>existing(m.id)).forEach(m=>{
   const b=document.createElement('button');b.type='button';b.className='ux06-life-link';
   b.dataset.ux06Module=m.id;
   const label=document.createElement('strong');label.textContent=m.label;
   const desc=document.createElement('span');desc.textContent=m.hint;
   b.append(label,desc);grid.appendChild(b);
 });
 nav.appendChild(grid);
 return nav;
}
function enhance(){
 state06.queued=false;
 const root=host();if(!root)return;
 const shell=root.querySelector('.v43-life-shell');
 const hero=root.querySelector('.v43-hero');
 if(!shell||!hero){observeContent(null);return;}
 root.classList.add('ux06-life-ready');
 const rail=root.querySelector('.v43-life-rail');
 if(rail){setAttr(rail,'role','navigation');setAttr(rail,'aria-label','Life Hub domains');}
 const overview=root.querySelector('#v43-life-overview');
 setAttr(overview,'aria-label','Return to Life Hub overview');
 // V43 also updates #v43-life-content without replacing the view root.
 const content=root.querySelector('#v43-life-content');
 observeContent(content);
 // Reinsert after the canonical renderer replaces children; never replace its content.
 let links=root.querySelector('#ux06-life-links');
 if(!links){links=createLinks();hero.after(links)}
 else if(links.previousElementSibling!==hero)hero.after(links);
 const selector=root.querySelector('#v43-life-select');
 if(selector){
   setAttr(selector,'aria-label','Life Hub domain');
   setAttr(selector,'title','Choose a Life Hub section');
 }
 const current=root.querySelector('.v43-life-rail [data-v43-life].active');
 root.querySelectorAll('.v43-life-rail [data-v43-life]').forEach(btn=>{
   if(btn===current)setAttr(btn,'aria-current','page');
   else if(btn.hasAttribute('aria-current'))btn.removeAttribute('aria-current');
 });
 root.querySelectorAll('.v43-domain[data-v43-life],.v43-attention .v43-row[data-v43-life]').forEach(card=>{
   if(card.hasAttribute('tabindex'))return;
   card.tabIndex=0;card.setAttribute('role','button');
   const title=card.querySelector('.v43-domain-title,.v43-row-title')?.textContent?.trim();
   if(title)card.setAttribute('aria-label','Open '+title);
 });
 const search=root.querySelector('#v43-life-search');
 if(search&&!search.hasAttribute('aria-label'))setAttr(search,'aria-label','Search current Life Hub domain');
}
function schedule(){
 if(state06.queued)return;
 state06.queued=true;queueMicrotask(enhance);
}
function install(){
 if(state06.installed)return;
 const root=host();if(!root)return;
 state06.installed=true;
 // The v43 renderer replaces only this view's children. No full-document scans.
 new MutationObserver(schedule).observe(root,{childList:true});
 root.addEventListener('click',e=>{
   const b=e.target.closest('[data-ux06-module]');
   if(b&&root.contains(b))route(b.dataset.ux06Module);
 });
 root.addEventListener('keydown',e=>{
   if(e.key!=='Enter'&&e.key!==' ')return;
   const card=e.target.closest('.v43-domain[data-v43-life],.v43-attention .v43-row[data-v43-life]');
   if(!card||!root.contains(card)||e.target!==card)return;
   e.preventDefault();card.click();
 });
 document.addEventListener('click',e=>{
   if(e.target.closest?.('.nav-item[data-view="life-hub"],[data-mobile-view="life-hub"],[data-ux02-view="life-hub"]'))queueMicrotask(schedule);
 });
 schedule();
}
window.OmniLife06={
 domains:DOMAINS.slice(),modules:MODULES.map(m=>m.id),relatedTools:MODULES.map(m=>m.id),canonical:'v43',
 openDomain:domain,openModule:route,refresh:schedule
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();