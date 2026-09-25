/* Protocol 2: field revisions, durable serial application, scope on both sides. */
(function(){'use strict';
const D=window.SecondBrainData,copy=D.copy;
let previous=null,meta=null,tail=Promise.resolve(),applying=false;
const id=()=>{let v=localStorage.getItem('omnios_sync_writer_v2');if(!v){v=crypto.randomUUID();localStorage.setItem('omnios_sync_writer_v2',v)}return v};
const R=()=>window.OmniRecovery35;
function doc(){const s=copy(state);delete s.core;delete s.passwords;delete s.passwordVault;if(s.settings)delete s.settings.notifications;if(s.v55){delete s.v55.privacy;delete s.v55.vault}const a=R()?.captureAux()||{};s.aux={};for(const[k,v]of Object.entries(a)){if(!D.userAux(k))continue;try{s.aux[k]={json:true,value:JSON.parse(v)}}catch(_){s.aux[k]={json:false,value:v}}}return s}
function capture(){const value=doc();if(!meta){meta=copy(state.core?.syncV2||D.initialize(value));previous=copy(value)}if(!applying)meta=D.capture(meta,previous,value,id());previous=copy(value);state.core=state.core||{};state.core.syncV2=meta;return meta}
function group(p){if(p[0]==='aux')return /bible/i.test(p[1]||'')?'bible':'settings';const k=p[0]?.toLowerCase()||'';if(['entries','goals','notes','reminders'].includes(k)||/task|project|inbox/.test(k))return'planning';if(/calendar|event|timeblock/.test(k))return'calendar';if(/habit|routine|workout|focus/.test(k))return'habits';if(/transaction|finance|budget|expense|income|wishlist|pantry|grocery/.test(k))return'finance';if(k==='life'||/people|document/.test(k))return'life';if(/diet|nutrition|meal|hydration|food|recipe|prep/.test(k))return'nutrition';if(k==='settings'||/appearance|profile|preference/.test(k))return'settings';return'other'}
function selection(){try{return JSON.parse(localStorage.getItem('omnios_sync_selection_v1')||'{}')}catch(_){return{}}}
function select(m,sel=selection()){
 const entries={};for(const[k,v]of Object.entries(m.entries)){const p=JSON.parse(k);if(['passwords','passwordVault','core'].includes(p[0]))continue;if(p[0]==='aux'&&p.length>1&&!D.userAux(p[1]))continue;if(p[0]==='settings'&&p[1]==='notifications')continue;if(p[0]==='v55'&&['privacy','vault'].includes(p[1]))continue;if(p.length&&!(p.length===1&&p[0]==='aux')&&sel[group(p)]===false)continue;entries[k]=copy(v)}
 return{version:2,counter:m.counter,entries,conflicts:[]};
}
function bundle(){const m=capture(),picked=select(m);return{protocol:2,version:2,device:{id:id()},selection:selection(),meta:picked,fingerprint:R().fingerprint(picked,{})}}
function serial(fn){const run=()=>navigator.locks?navigator.locks.request('secondbrain-sync-commit',fn):fn();const job=tail.then(run,run);tail=job.catch(()=>{});return job}
function applyDocument(data){
 const old=state,aux=data.aux||{};delete data.aux;
 const keep={core:old.core,passwords:old.passwords,passwordVault:old.passwordVault,notifications:old.settings?.notifications,privacy:old.v55?.privacy,vault:old.v55?.vault};
 const next=copy(data);next.core=keep.core;for(const k of ['passwords','passwordVault'])if(keep[k]!==undefined)next[k]=keep[k];next.settings=next.settings||{};if(keep.notifications)next.settings.notifications=keep.notifications;if(keep.privacy||keep.vault){next.v55=next.v55||{};if(keep.privacy)next.v55.privacy=keep.privacy;if(keep.vault)next.v55.vault=keep.vault}
 const now=R().captureAux(),changes=[];for(const k of new Set([...Object.keys(now),...Object.keys(aux)])){if(!D.userAux(k))continue;const v=aux[k];if(!v)changes.push([k,null,true]);else{const raw=v.json?JSON.stringify(v.value):String(v.value??'');if(now[k]!==raw)changes.push([k,raw,false])}}
 R().applyAuxDurably(changes);state=next;
}
async function mergeNow(remote){
 if(remote?.protocol!==2||remote?.meta?.version!==2)throw Error('Refresh both devices to the latest Second Brain before pairing.');
 let incoming=select(remote.meta),merged=D.merge(capture(),incoming);
 if(!merged.changed&&D.equal(meta,merged.meta))return{changed:false,modules:[],aux:[]};
 await R().makeSnapshot('Before device sync',{kind:'pre-sync'});
 // Recompute after the asynchronous snapshot, preserving edits made meanwhile.
 merged=D.merge(capture(),incoming);const before=copy(state),beforeAux=R().captureAux(),beforeMeta=copy(meta);
 applying=true;window.__omniSyncApplying=true;
 try{
  applyDocument(copy(merged.document));meta=merged.meta;state.core.syncV2=meta;previous=doc();
  // The durable helper verifies localStorage and waits for the IDB transaction.
  await R().persistStateDurably();
  window.OmniBibleReloadFromStorage?.();window.renderAll?.();
 }catch(error){
  const currentAux=R().captureAux();const rollback=[...new Set([...Object.keys(currentAux),...Object.keys(beforeAux)])].map(k=>[k,beforeAux[k],!Object.hasOwn(beforeAux,k)]);
  state=before;meta=beforeMeta;try{R().applyAuxDurably(rollback);await R().persistStateDurably()}catch(e){console.error('Recovery needed after interrupted commit',e)}previous=doc();throw error;
 }finally{applying=false;window.__omniSyncApplying=false}
 return{changed:merged.changed,metadataChanged:true,modules:['Selected pages'],aux:[],conflicts:meta.conflicts.length};
}
function merge(remote){return serial(()=>mergeNow(remote))}
function disconnect(){window.OmniLocalWifiSync73?.disconnect?.();window.OmniDeviceSync?.disconnect?.()}
window.SecondBrainSync={capture,bundle,merge,disconnect,select,conflicts:()=>copy(capture().conflicts||[])};
document.addEventListener('omnios:data-changed',()=>{if(!applying)capture()});
// Shared browser tabs use the same durable revisions, while maintaining their own
// dirty edits. Suppression prevents echoes from creating another revision.
let tabTimer;window.addEventListener('storage',e=>{if(e.key!=='omnios_v3_state'||!e.newValue||applying)return;clearTimeout(tabTimer);tabTimer=setTimeout(()=>{try{const saved=JSON.parse(e.newValue);if(saved.core?.syncV2)merge({protocol:2,meta:saved.core.syncV2}).catch(error=>window.toast?.('Other-tab changes could not be saved: '+error.message))}catch(_){}},200)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',capture,{once:true});else capture();
})();
