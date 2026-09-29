(function(){'use strict';
const style=document.createElement('style');style.textContent=`
:focus-visible{outline:2px solid var(--accent-cyan,#67e8f9)!important;outline-offset:3px}
button,input,select,textarea{font:inherit} .omni-sync-select label{min-height:36px;display:inline-flex;align-items:center;gap:6px}
[data-password-editor] label{display:block;margin:12px 0 6px}[data-password-editor] input,[data-password-editor] textarea{width:100%}
.sb-indeterminate{animation:sb-transfer 1.3s ease-in-out infinite alternate}@keyframes sb-transfer{to{transform:translateX(180%)}}
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;scroll-behavior:auto!important;transition:none!important}}
@media(max-width:760px){.btn,.icon-btn{min-height:44px}input,select,textarea{font-size:16px!important}.omni-sync-modal{max-height:92dvh;overflow:auto}}
#view-today .v56-daily-grid{display:none}#view-today .v56-daily-head{padding:10px 14px}
.sb-recovery-tools{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}

/* Unified dropdown/filter UX. Keep native selects for reliable iOS/Android pickers. */
select.sb-select,.form-select.sb-select,.filter-select.sb-select{
  box-sizing:border-box;
  min-height:38px!important;
  max-width:100%;
  padding-top:0!important;
  padding-bottom:0!important;
  padding-left:12px!important;
  padding-right:36px!important;
  border-radius:10px!important;
  line-height:1.2!important;
  background-position:right 11px center!important;
  background-size:14px 14px!important;
  touch-action:manipulation;
  text-overflow:ellipsis;
}
:where(.toolbar,.list-controls,.notes-toolbar,.dashboard-toolbar,.habit-toolbar,.v37-filter-row) :is(.filter-select.sb-select,.form-select.sb-select){
  width:auto!important;
  min-width:128px;
  max-width:min(240px,100%);
}
.filter-select.sb-select.sb-select-active{
  border-color:color-mix(in srgb,var(--accent-cyan,#67e8f9) 58%,var(--border-color,#384152))!important;
  background-color:color-mix(in srgb,var(--accent-cyan,#67e8f9) 7%,var(--bg-base,#0f1115))!important;
}
.sb-filter-rail{
  display:flex!important;
  align-items:center!important;
  gap:8px!important;
  min-width:0;
}

/* Efficient card flow. Layout-only: card padding, internal margins and section spacing remain untouched. */
.sb-layout-grid{
  min-width:0;
  align-items:stretch;
}
.sb-layout-grid > *{min-width:0}
.sb-layout-grid[data-sb-cols]{
  grid-template-columns:repeat(var(--sb-layout-cols),minmax(0,1fr))!important;
}
@media(max-width:760px){
  .sb-layout-grid[data-sb-mobile-one="1"]{
    grid-template-columns:minmax(0,1fr)!important;
  }
}


/* Final mobile UX contract. This normalizes behavior only; it deliberately does not
   redefine card padding, section margins, or page spacing. */
@media(max-width:760px){
  :root{
    --sb-mobile-control:44px;
    --sb-mobile-edge:8px;
  }

  html,body{
    width:100%;
    max-width:100%;
    overflow-x:hidden!important;
    overscroll-behavior-x:none;
  }
  .view-container,.view,.view.active,.view>*{
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box;
  }
  .view-container{
    scroll-padding-top:calc(var(--ux-topbar-h,54px) + 10px);
    scroll-padding-bottom:calc(var(--ux-bottomnav-h,64px) + env(safe-area-inset-bottom) + 12px);
  }

  /* One touch-target standard everywhere. */
  :is(
    .btn,.icon-btn,.view-btn,.filter-select,.form-select,.search-input,
    button:not(.v36-month-date):not(.v602-mini-day):not(.habit-check):not(.v34-habit-month-day)
  ){
    min-height:var(--sb-mobile-control)!important;
  }
  :is(
    input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="hidden"]),
    select,textarea
  ){
    max-width:100%!important;
    font-size:16px!important;
  }
  :is(
    input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="color"]):not([type="hidden"]),
    select
  ){
    min-height:var(--sb-mobile-control)!important;
  }
  textarea{min-height:92px}
  .form-grid,.form-row,.settings-row,.toolbar,.toolbar-group{min-width:0}
  .form-grid>*,
  .form-row>*,
  .settings-row>*,
  .toolbar>*,
  .toolbar-group>*{min-width:0}

  /* One navigation pattern for tabs/modes: a single swipeable rail, never a squeezed grid. */
  :is(
    .v38-fin-tabs,.workout-tabs,.tab-btns,.v35-segmented,.v43-life-tabs,
    .rt-tabs,.v58-seg,.v431-tabs,.org-seg,.help-nav,#settings-tabs
  ){
    display:flex!important;
    flex-wrap:nowrap!important;
    grid-template-columns:none!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    overscroll-behavior-inline:contain;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none!important;
    scroll-snap-type:x proximity;
    max-width:100%!important;
  }
  :is(
    .v38-fin-tabs,.workout-tabs,.tab-btns,.v35-segmented,.v43-life-tabs,
    .rt-tabs,.v58-seg,.v431-tabs,.org-seg,.help-nav,#settings-tabs
  )::-webkit-scrollbar{display:none!important}
  :is(
    .v38-fin-tabs,.workout-tabs,.tab-btns,.v35-segmented,.v43-life-tabs,
    .rt-tabs,.v58-seg,.v431-tabs,.org-seg,.help-nav,#settings-tabs
  )>*{
    flex:0 0 auto!important;
    width:auto!important;
    min-width:max-content!important;
    scroll-snap-align:start;
    white-space:nowrap!important;
  }

  /* Headers keep titles readable; actions may scroll instead of crushing the title/card. */
  :is(
    .v35-page-head,.v43-page-head,.v58-page-head,.v38-finance-head,
    .workout-hero,.org-hero,.card-header,.v35-card-head,.v43-card-head,
    .v55-card-head,.v58-card-head,.v38-fin-card-head
  ){
    min-width:0!important;
  }
  :is(
    .v35-page-head,.v43-page-head,.v58-page-head,.v38-finance-head,
    .workout-hero,.org-hero
  ) > :first-child{
    min-width:0!important;
    flex:1 1 180px!important;
  }
  :is(
    .v35-page-actions,.v43-page-actions,.v58-page-actions,.v38-finance-head-actions,
    .workout-hero-actions,.org-actions
  ){
    max-width:100%!important;
    min-width:0!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    flex-wrap:nowrap!important;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none!important;
  }
  :is(
    .v35-page-actions,.v43-page-actions,.v58-page-actions,.v38-finance-head-actions,
    .workout-hero-actions,.org-actions
  )::-webkit-scrollbar{display:none!important}
  :is(
    .v35-page-actions,.v43-page-actions,.v58-page-actions,.v38-finance-head-actions,
    .workout-hero-actions,.org-actions
  )>*{
    flex:0 0 auto!important;
  }

  /* Keep cards and rich content inside the viewport without changing their spacing. */
  :is(
    .card,.v35-card,.v43-card,.v55-card,.v58-card,.v38-fin-card,.rt-card,
    .note-card,.goal586-card,.org-card,.v37-card,.workout-card
  ){
    min-width:0!important;
    max-width:100%!important;
    box-sizing:border-box;
  }
  :is(
    .card-title,.v35-card-title,.v43-card-title,.v55-card-title,.v58-card-title,
    .v38-fin-card-title,.v35-row-title,.v43-row-title,.v55-row-title,.v38-txn-title
  ){
    min-width:0!important;
    overflow-wrap:anywhere;
  }
  img,svg,video,canvas{max-width:100%}
  pre{max-width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}

  /* Wide data stays scrollable inside its own surface instead of widening the whole page. */
  :is(
    .table-container,.table-wrap,.set-table-wrap,.calendar-container,
    .master-cal-shell-wrap,.habit-week-card,.v37-week-bars,.v34-habit-matrix-wrap
  ){
    max-width:100%!important;
    overflow-x:auto!important;
    overscroll-behavior-inline:contain;
    -webkit-overflow-scrolling:touch;
  }

  /* Consistent mobile dialogs: bounded by visible chrome, body scrolls, footer remains usable. */
  .modal{
    width:min(100%,680px)!important;
    max-width:calc(100vw - max(16px,env(safe-area-inset-left) + env(safe-area-inset-right)))!important;
    max-height:calc(
      var(--ux-visible-h,100dvh) -
      var(--ux-topbar-h,54px) -
      var(--ux-bottomnav-h,64px) -
      18px
    )!important;
    box-sizing:border-box!important;
    overflow:hidden!important;
  }
  .modal-body,.v35-modal-body,.v45-modal-body{
    min-height:0!important;
    overflow-y:auto!important;
    overscroll-behavior:contain;
    -webkit-overflow-scrolling:touch;
  }
  .modal-footer{
    max-width:100%!important;
    min-width:0!important;
    flex-wrap:wrap!important;
  }

  /* Fixed app chrome uses the same control height and remains above page content. */
  :root{--v89-mobile-header-control:var(--sb-mobile-control)}
  #v35-mobile-add,#v35-mobile-actions,.v35-topbar-icon{
    min-height:var(--sb-mobile-control)!important;
    height:var(--sb-mobile-control)!important;
  }
  .mobile-nav button{touch-action:manipulation}
  .mobile-nav,.topbar{isolation:isolate}

  *{-webkit-tap-highlight-color:transparent}
}

@media(max-width:390px){
  :is(
    .v35-page-head,.v43-page-head,.v58-page-head,.v38-finance-head,
    .workout-hero,.org-hero
  ){
    align-items:stretch!important;
  }
  :is(
    .v35-page-actions,.v43-page-actions,.v58-page-actions,.v38-finance-head-actions,
    .workout-hero-actions,.org-actions
  ){
    width:100%!important;
  }
}

@media(max-width:760px){
  select.sb-select,.form-select.sb-select,.filter-select.sb-select{
    min-height:44px!important;
    padding-left:12px!important;
    padding-right:38px!important;
    background-position:right 12px center!important;
  }
  .sb-filter-rail{
    flex-wrap:nowrap!important;
    overflow-x:auto!important;
    overflow-y:hidden!important;
    overscroll-behavior-inline:contain;
    -webkit-overflow-scrolling:touch;
    scrollbar-width:none;
    padding-bottom:2px;
  }
  .sb-filter-rail::-webkit-scrollbar{display:none}
  .sb-filter-rail :is(.filter-select.sb-select,.form-select.sb-select){
    flex:0 0 auto!important;
    width:auto!important;
    min-width:136px!important;
    max-width:78vw!important;
  }
}
`;document.head.append(style);
const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function download(name,value){const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function conflicts(){const rows=SecondBrainSync.conflicts();const o=document.createElement('div');o.className='modal-overlay active';o.innerHTML='<section class="modal" role="dialog" aria-modal="true" aria-label="Sync alternatives"><div class="modal-header"><h3>Retained sync alternatives</h3><button class="icon-btn" data-close aria-label="Close">×</button></div><div class="modal-body"><p>Different values received from another device are retained here for review. Export these alternatives before making corrections in the relevant page.</p>'+ (rows.length?rows.map(r=>'<details><summary>'+E(JSON.parse(r.path).join(' › '))+'</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">'+E(JSON.stringify(r.values.map(v=>v.node?.value),null,2))+'</pre></details>').join(''):'<p>No retained alternatives.</p>')+'<button class="btn" data-export>Export alternatives</button></div></section>';document.body.append(o);o.querySelector('[data-close]').onclick=()=>o.remove();o.querySelector('[data-export]').onclick=()=>download('SecondBrain_SyncAlternatives.json',rows)}
function addTools(){const exportBtn=document.getElementById('v35-db-export');if(!exportBtn||document.getElementById('sb-recovery-tools'))return;const box=document.createElement('div');box.id='sb-recovery-tools';box.className='sb-recovery-tools';box.innerHTML='<button class="btn" data-conflicts>Review sync alternatives</button><button class="btn" data-diagnostics>Export diagnostics</button>';exportBtn.closest('.v35-card')?.append(box);box.querySelector('[data-conflicts]').onclick=conflicts;box.querySelector('[data-diagnostics]').onclick=async()=>{let quota;try{quota=await navigator.storage?.estimate()}catch(_){}download('SecondBrain_Diagnostics.json',{version:2,at:new Date().toISOString(),online:navigator.onLine,secureContext:isSecureContext,storage:quota,recordCounts:Object.fromEntries(Object.entries(state).filter(([,v])=>Array.isArray(v)).map(([k,v])=>[k,v.length])),retainedAlternatives:SecondBrainSync.conflicts().length})}}
let pending=false;const base=window.renderAll;if(base)window.renderAll=function(){const result=base.apply(this,arguments);if(!pending){pending=true;requestAnimationFrame(()=>{pending=false;addTools()})}return result};

const cardGridSpecs=[
  {
    selector:'.workout-kpi-grid,.kpi-grid,.habit-summary-grid,.diet-kpi-grid,.v37-session-stats,.v37-progress-summary,.v38-fin-grid,.org-kpis,.conn34-kpis,.v58-kpis,.v58-flow,.v58-project-health,.goal586-kpis,.rt-kpis,.bib-today-metrics-v67,.bib-atlas-stats',
    min:138,max:6,mobileOne:false
  },
  {
    selector:'.template-grid,.exercise-library-grid,.history-grid,.v25-group-grid,.goal-grid,.custom-list-grid,.diet-db-grid,.diet-prep-grid,.power-grid,.power-pantry-grid,.v35-project-grid,.v35-record-grid,.v37-template-grid,.v37-library-grid,.v37-history-grid,.v38-account-grid,.v38-rec-grid,.v38-goal-grid,.org-grid,.goal586-grid,.goal586-board,.bib-today-guidance-v67,.bib-today-reading-list-v67,.rd611-steps',
    min:224,max:4,mobileOne:true
  },
  {
    selector:'.analytics-grid,.v38-overview-charts',
    min:300,max:3,mobileOne:true
  },
  {
    selector:'.workout-analytics-grid,.master-cal-agenda,.diet-progress-grid,.power-grid-2,.v34-habit-month-cards,.v35-review-grid,.v35-life-detail-grid,.v37-progress-grid,.v38-insight-grid,.w63-grid,.bib-today-bottom-v67',
    min:300,max:2,mobileOne:true
  },
  {
    selector:'.v38-budget-grid,.v37-start-grid,.quick-add-grid,.v25-mobile-more-grid,.v36-preview-schedule,.calendar-preview-actions,.pantry-image-actions,.pantry-photo-actions,.rt-hero-actions,.workout-hero-actions',
    min:220,max:2,mobileOne:true
  }
];
function layoutColumnsFor(width,min,max){
  if(!Number.isFinite(width)||width<=0)return 1;
  return Math.max(1,Math.min(max,Math.floor(width/min)));
}
function applyCardGridLayout(el,spec){
  if(!(el instanceof Element))return;
  el.classList.add('sb-layout-grid');
  if(spec.mobileOne)el.dataset.sbMobileOne='1';else delete el.dataset.sbMobileOne;
  const width=el.clientWidth||el.getBoundingClientRect().width||0;
  const cols=layoutColumnsFor(width,spec.min,spec.max);
  if(String(cols)!==el.dataset.sbCols){
    el.dataset.sbCols=String(cols);
    el.style.setProperty('--sb-layout-cols',String(cols));
  }
}
function polishCardLayouts(root=document){
  cardGridSpecs.forEach(spec=>{
    root.querySelectorAll?.(spec.selector).forEach(el=>applyCardGridLayout(el,spec));
    if(root instanceof Element&&root.matches?.(spec.selector))applyCardGridLayout(root,spec);
  });
}
const cardResizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
  entries.forEach(({target})=>{
    const spec=cardGridSpecs.find(s=>target.matches?.(s.selector));
    if(spec)applyCardGridLayout(target,spec);
  });
}):null;
const observedCardGrids=new WeakSet();
function observeCardLayouts(root=document){
  cardGridSpecs.forEach(spec=>{
    const els=[];
    if(root instanceof Element&&root.matches?.(spec.selector))els.push(root);
    root.querySelectorAll?.(spec.selector).forEach(el=>els.push(el));
    els.forEach(el=>{
      applyCardGridLayout(el,spec);
      if(cardResizeObserver&&!observedCardGrids.has(el)){
        observedCardGrids.add(el);
        cardResizeObserver.observe(el);
      }
    });
  });
}

function polishSelect(select){
  if(!(select instanceof HTMLSelectElement)||select.multiple||select.size>1)return;
  select.classList.add('sb-select');
  if(select.classList.contains('filter-select')){
    select.classList.toggle('sb-select-active',select.selectedIndex>0&&select.value!=='');
  }
  if(!select.getAttribute('aria-label')&&!select.getAttribute('aria-labelledby')&&!(select.labels&&select.labels.length)){
    const group=select.closest('.form-group,.settings-row,.toolbar-group,.list-controls');
    const label=group?.querySelector('label,.form-label,.settings-row-label');
    const text=label?.textContent?.replace(/\s+/g,' ').trim();
    if(text)select.setAttribute('aria-label',text.slice(0,80));
  }
}
function polishControlScope(root=document){
  root.querySelectorAll?.('select').forEach(polishSelect);
  const scopes=root.querySelectorAll?.('.toolbar-group,.list-controls,.notes-toolbar,.dashboard-toolbar,.habit-toolbar,.v37-filter-row')||[];
  scopes.forEach(scope=>{
    const count=scope.querySelectorAll('select.filter-select,select.form-select').length;
    scope.classList.toggle('sb-filter-rail',count>=2);
  });
  observeCardLayouts(root);
}
let polishQueued=false;
function queueControlPolish(){
  if(polishQueued)return;
  polishQueued=true;
  requestAnimationFrame(()=>{polishQueued=false;polishControlScope(document)});
}
document.addEventListener('change',e=>{if(e.target instanceof HTMLSelectElement)polishSelect(e.target)},true);
const controlObserver=new MutationObserver(mutations=>{
  if(mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1)))queueControlPolish();
});
controlObserver.observe(document.body||document.documentElement,{childList:true,subtree:true});
polishControlScope(document);
polishCardLayouts(document);

document.addEventListener('secondbrain:transfer',e=>{const d=e.detail;document.querySelectorAll('[data-local-progress-text]').forEach(el=>el.textContent=`Receiving ${Math.round(d.received/1024)} / ${Math.round(d.total/1024)} KB`)});
document.addEventListener('click',e=>{if(e.target.closest('[data-sb-disconnect]')){SecondBrainSync.disconnect();e.target.closest('.omni-sync-overlay')?.remove()}requestAnimationFrame(addTools)});addTools();
})();
