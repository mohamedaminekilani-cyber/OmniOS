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
}
let polishQueued=false;
function queueControlPolish(){
  if(polishQueued)return;
  polishQueued=true;
  requestAnimationFrame(()=>{polishQueued=false;polishControlScope(document)});
}
document.addEventListener('change',e=>{if(e.target instanceof HTMLSelectElement)polishSelect(e.target)},true);
const controlObserver=new MutationObserver(mutations=>{
  if(mutations.some(m=>Array.from(m.addedNodes).some(n=>n.nodeType===1&&(n.matches?.('select,.toolbar-group,.list-controls,.notes-toolbar,.dashboard-toolbar,.habit-toolbar,.v37-filter-row')||n.querySelector?.('select')))))queueControlPolish();
});
controlObserver.observe(document.body||document.documentElement,{childList:true,subtree:true});
polishControlScope(document);

document.addEventListener('secondbrain:transfer',e=>{const d=e.detail;document.querySelectorAll('[data-local-progress-text]').forEach(el=>el.textContent=`Receiving ${Math.round(d.received/1024)} / ${Math.round(d.total/1024)} KB`)});
document.addEventListener('click',e=>{if(e.target.closest('[data-sb-disconnect]')){SecondBrainSync.disconnect();e.target.closest('.omni-sync-overlay')?.remove()}requestAnimationFrame(addTools)});addTools();
})();
