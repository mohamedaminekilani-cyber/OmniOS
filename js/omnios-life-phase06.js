/* OmniOS UX Phase 06 — Life Hub V43 is the canonical renderer.
   Accessibility and navigation bridge only: no data or renderer replacement. */
(function(){
'use strict';
if(window.OmniLife06)return;
const ROOT='view-life-hub';
const TOOLS=[
  ['workout','Workout'],['diet','Nutrition'],['budget','Finance'],
  ['grocery','Grocery'],['pantry','Pantry'],['wishlist','Wishlist']
];
const state={installed:false,pending:false,contentObserved:new WeakSet()};
const view=()=>document.getElementById(ROOT);
function toolButton(id,label){
  const b=document.createElement('button');
  b.type='button';b.className='ux06-tool';
  b.dataset.ux06View=id;b.textContent=label;
  b.addEventListener('click',()=>{
    if(typeof window.switchView==='function')window.switchView(id);
  });
  return b;
}
function decorateDomains(root){
  root.querySelectorAll('.v43-domain[data-v43-life],.v43-row.clickable[data-v43-life]').forEach(el=>{
    if(el.dataset.ux06Accessible==='1')return;
    el.dataset.ux06Accessible='1';
    el.tabIndex=0;el.setAttribute('role','button');
    const text=el.querySelector('.v43-domain-title,.v43-row-title')?.textContent?.trim();
    if(text)el.setAttribute('aria-label','Open '+text);
  });
}
function decorate(){
  state.pending=false;
  const root=view();
  if(!root||!root.classList.contains('active'))return;
  // V43 owns the only Life Hub renderer. Older V35 markup remains untouched.
  const hero=root.querySelector('.v43-hero'),shell=root.querySelector('.v43-life-shell');
  if(!hero||!shell)return;
  root.classList.add('ux06-life-ready');
  const rail=root.querySelector('.v43-life-rail');
  if(rail){rail.setAttribute('aria-label','Life Hub domains');rail.setAttribute('role','navigation');}
  const select=root.querySelector('#v43-life-select');
  if(select)select.setAttribute('aria-label','Choose a Life Hub domain');
  const search=root.querySelector('#v43-life-search');
  if(search)search.setAttribute('aria-label','Search within the current Life Hub domain');
  const overview=root.querySelector('#v43-life-overview');
  if(overview)overview.setAttribute('aria-label','Return to Life Hub overview');
  if(!root.querySelector('#ux06-life-tools')){
    const nav=document.createElement('nav');
    nav.id='ux06-life-tools';nav.className='ux06-tools';
    nav.setAttribute('aria-label','Related life modules');
    const title=document.createElement('span');
    title.className='ux06-tools-label';title.textContent='Related tools';
    nav.append(title,...TOOLS.map(([id,label])=>toolButton(id,label)));
    hero.after(nav);
  }
  const content=root.querySelector('#v43-life-content');
  if(content){
    decorateDomains(content);
    if(!state.contentObserved.has(content)){
      state.contentObserved.add(content);
      new MutationObserver(queue).observe(content,{childList:true});
    }
  }
  root.querySelectorAll('.v43-life-btn[data-v43-life]').forEach(btn=>{
    if(btn.classList.contains('active'))btn.setAttribute('aria-current','page');
    else btn.removeAttribute('aria-current');
  });
}
function queue(){
  if(state.pending)return;
  state.pending=true;queueMicrotask(decorate);
}
function onDomainKey(e){
  if(e.key!=='Enter'&&e.key!==' ')return;
  const el=e.target.closest?.('#'+ROOT+' .v43-domain[data-v43-life],#'+ROOT+' .v43-row.clickable[data-v43-life]');
  if(!el||el!==document.activeElement)return;
  e.preventDefault();
  el.click(); // use existing V43 delegated click, including its persistence
}
function install(){
  if(state.installed)return;
  const root=view();if(!root)return;
  state.installed=true;
  new MutationObserver(queue).observe(root,{childList:true});
  document.addEventListener('keydown',onDomainKey);
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-view="life-hub"],[data-ux02-view="life-hub"]'))queueMicrotask(queue);
  },false);
  window.addEventListener('hashchange',queue);
  queue();
}
window.OmniLife06={refresh:queue,relatedTools:TOOLS.map(x=>x[0]),canonical:'v43'};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
