/* Second Brain data protocol v2. Pure functions: also exercised by node:test. */
(function(root){
'use strict';
const bad=new Set(['__proto__','prototype','constructor']);
const copy=v=>JSON.parse(JSON.stringify(v));
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const key=p=>JSON.stringify(p);
function path(k){const p=JSON.parse(k);if(!Array.isArray(p)||p.length>64||p.some(x=>typeof x!=='string'||bad.has(x)))throw Error('Invalid data path');return p}
function flatten(value,p=[],out={}){
 if(value===undefined)return out;
 if(p.length>60)throw Error('Data nesting is too deep');
 if(Array.isArray(value)){
  const records=value.every(x=>x&&typeof x==='object'&&!Array.isArray(x)&&x.id!=null)&&new Set(value.map(x=>String(x.id))).size===value.length;
  if(records){out[key(p)]={kind:'records',order:value.map(x=>String(x.id))};for(const x of value)flatten(x,[...p,'@'+x.id],out)}
  else out[key(p)]={kind:'value',value:copy(value)};
 }else if(value&&typeof value==='object'){
  out[key(p)]={kind:'object'};for(const k of Object.keys(value).sort()){if(bad.has(k))throw Error('Unsafe property');flatten(value[k],[...p,k],out)}
 }else out[key(p)]={kind:'value',value};
 return out;
}
function compare(a,b){return (Number(a?.[0])||0)-(Number(b?.[0])||0)||String(a?.[1]||'').localeCompare(String(b?.[1]||''))}
function materialize(entries){
 const children=new Map();
 for(const [k,e]of Object.entries(entries)){const p=path(k);if(!p.length)continue;const parent=key(p.slice(0,-1));if(!children.has(parent))children.set(parent,[]);children.get(parent).push(p[p.length-1])}
 function build(p,ancestorDeletion=null){
  const e=entries[key(p)];if(!e)return undefined;
  if(ancestorDeletion&&compare(e.rev,ancestorDeletion)<=0)return undefined;
  if(e.deleted)return undefined;
  const node=e.node;if(!node)return undefined;
  if(node.kind==='value')return copy(node.value);
  const names=[...new Set(children.get(key(p))||[])];
  if(node.kind==='records'){
   const all=new Map();for(const n of names){const v=build([...p,n],ancestorDeletion);if(v!==undefined&&v&&typeof v==='object')all.set(n.slice(1),v)}
   const order=[...(node.order||[]),...[...all.keys()].sort()];const seen=new Set();return order.filter(id=>{if(seen.has(id)||!all.has(id))return false;seen.add(id);return true}).map(id=>all.get(id));
  }
  const out={};for(const n of names){const v=build([...p,n],ancestorDeletion);if(v!==undefined)out[n]=v}return out;
 }
 // A deletion of a container wins over older descendants; resurrection must
 // explicitly recreate that container with a newer revision.
 return build([])||{};
}
function initialize(doc){const entries={};for(const [k,node]of Object.entries(flatten(doc)))entries[k]={node,rev:[0,'baseline'],deleted:false};return{version:2,counter:0,entries,conflicts:[]}}
function capture(meta,previous,current,writer){
 const m=copy(meta||initialize(previous)),a=flatten(previous),b=flatten(current);let revision=null;
 for(const k of new Set([...Object.keys(a),...Object.keys(b)])){
  if(equal(a[k],b[k]))continue;
  revision=revision||[++m.counter,writer];m.entries[k]=b[k]===undefined?{rev:revision,deleted:true}:{node:b[k],rev:revision,deleted:false};
 }
 return m;
}
function merge(local,remote){
 if(remote?.version!==2||!remote.entries||typeof remote.entries!=='object')throw Error('Update both devices before syncing');
 const result=copy(local);let changed=false;result.counter=Math.max(result.counter||0,remote.counter||0);
 if(!Number.isSafeInteger(result.counter)||result.counter<0)throw Error('Invalid revision');
 const conflicts=result.conflicts||[];
 for(const [k,r]of Object.entries(remote.entries)){
  path(k);if(!r||!Array.isArray(r.rev)||r.rev.length!==2||!Number.isSafeInteger(r.rev[0])||r.rev[0]<0||typeof r.rev[1]!=='string'||r.rev[1].length>150)throw Error('Invalid record revision');
  if(!r.deleted&&(!r.node||!['object','records','value'].includes(r.node.kind)))throw Error('Invalid record');
  if(!r.deleted&&r.node.kind==='records'&&(!Array.isArray(r.node.order)||r.node.order.some(x=>typeof x!=='string')))throw Error('Invalid record order');
  if(!r.deleted&&r.node.kind==='value'){const check=v=>{if(v&&typeof v==='object')for(const k of Object.keys(v)){if(bad.has(k))throw Error('Unsafe property');check(v[k])}};check(r.node.value);}
  result.counter=Math.max(result.counter,r.rev[0]);const l=result.entries[k];let cmp=l?compare(r.rev,l.rev):1;
  // Initial imported datasets can differ without revision history. Make the
  // choice deterministic and retain the alternative for explicit recovery.
  if(l&&cmp===0&&!equal(l,r))cmp=JSON.stringify(r).localeCompare(JSON.stringify(l));
  if(l&&!l.deleted&&!r.deleted&&l.node?.kind==='value'&&r.node?.kind==='value'&&!equal(l.node,r.node)&&l.rev[1]!==r.rev[1]){
   const id=key([k,JSON.stringify(l.rev),JSON.stringify(r.rev)].sort());
   if(!conflicts.some(x=>x.id===id))conflicts.push({id,path:k,values:[copy(l),copy(r)]});
  }
  if(cmp>0){result.entries[k]=copy(r);changed=true}
 }
 result.conflicts=conflicts.slice(-200);return {meta:result,changed:changed||!equal(local.conflicts,result.conflicts),document:materialize(result.entries)};
}
const DEVICE_AUX=/^omnios_(?:sync_|push_|local_answer_|app_snapshot_|.*(?:storage_test|boot_cache|parts?_cache|startup)|v35_full_reset_at)/i;
function userAux(k){return /^omnios_/i.test(k)&&!DEVICE_AUX.test(k)&&!['omnios_v3_state','omnios_v3_backup','omnios_ui_preferences_v1','omnios_data_v2_meta'].includes(k)}
const groups={tasks:['entries'],calendar:['calendarEvents','life/timeBlocks'],routines:['routines'],habits:['habits'],bible:['aux/omnios_bible_v571','aux/omnios_bible_v57'],nutrition:['dietFoods','dietRecipes','dietPlan','dietLog','dietHydration','dietPrep'],finance:['transactions','goals','budgets','accounts'],notes:['notes'],workout:['workouts','workoutTemplates','focusDaily','focusSessions','focusGuard'],shopping:['groceryLists','pantry','wishlist'],life:['life'],settings:['settings','v55','v56','v57']};
function scopeAllowed(k,scopes){const p=path(k);if(p[0]==='passwords'||p[0]==='passwordVault')return false;if(!p.length)return true;const joined=p.join('/');const matching=Object.entries(groups).filter(([,prefixes])=>prefixes.some(s=>joined===s||joined.startsWith(s+'/')));if(matching.length)return matching.some(([g])=>scopes.includes(g));if(p[0]==='aux')return scopes.includes('settings');return scopes.includes('other')}
function select(meta,scopes){const entries={};for(const [k,v]of Object.entries(meta.entries))if(scopeAllowed(k,scopes))entries[k]=copy(v);return{version:2,counter:meta.counter,entries,conflicts:[]}}
root.SecondBrainData={copy,equal,flatten,materialize,initialize,capture,merge,userAux,groups,scopeAllowed,select,compare};
})(typeof window!=='undefined'?window:globalThis);
