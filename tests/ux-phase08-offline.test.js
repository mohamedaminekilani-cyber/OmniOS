import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const sw=fs.readFileSync('sw.js','utf8');
function offlineServiceWorker(saved={}){
 const listeners={},cacheReads=[],cacheWrites=[],deleted=[];
 const records=new Map(Object.entries(saved));
 const shell={
   match:async(request,options)=>{const key=typeof request==='string'?request:request.url;cacheReads.push({key,ignoreSearch:options?.ignoreSearch||false});return records.get(key)},
   put:async(req,res)=>{cacheWrites.push(req);records.set(req.url,res)}
 };
 const ctx=vm.createContext({
   console,URL,Headers,Response,clients:{matchAll:async()=>[]},
   caches:{
     open:async key=>{assert.equal(key,'second-brain-shell-v12');return shell},
     keys:async()=>['second-brain-shell-v11','second-brain-shell-v12','omnios-user-assets-v1','omnios-app-snapshot-v1-original'],
     delete:async key=>{deleted.push(key);return true}
   },
   fetch:async()=>{throw Error('Synthetic offline network failure')},
   self:{location:{origin:'https://example.test'},clients:{claim:async()=>{}},
     skipWaiting(){},addEventListener:(name,fn)=>{listeners[name]=fn}}
 });
 vm.runInContext(sw,ctx,{filename:'sw.js'});
 const req=(pathname,destination='document',mode='navigate',headers={})=>({
   method:'GET',url:'https://example.test'+pathname,destination,mode,headers:new Headers(headers)
 });
 const fetchOffline=async(request)=>{
   let response;
   listeners.fetch({request,respondWith(promise){response=Promise.resolve(promise)}});
   return response?await response:null;
 };
 return {listeners,fetchOffline,req,records,cacheReads,cacheWrites,deleted};
}

test('Phase 08 offline document navigation recovers cached validated shell, not private data',async()=>{
 const cached=new Response('<!doctype html><title>Offline OmniOS shell</title>',{headers:{'content-type':'text/html'}});
 const h=offlineServiceWorker({'./index.html':cached});
 const response=await h.fetchOffline(h.req('/other-page'));
 assert.ok(response);
 assert.match(await response.text(),/Offline OmniOS shell/);
 assert.ok(h.cacheReads.some(x=>x.key==='./index.html'));
 assert.equal(h.cacheWrites.length,0,'failed network response must not enter cache');
});

test('Phase 08 offline JS is recovered from shell cache without any app-part caching',async()=>{
 const script=new Response('window.OMNIOS_OFFLINE=true',{headers:{'content-type':'text/javascript'}});
 const h=offlineServiceWorker({'https://example.test/js/omnios-calendar-phase05.js':script});
 const out=await h.fetchOffline(h.req('/js/omnios-calendar-phase05.js','script','cors'));
 assert.match(await out.text(),/OMNIOS_OFFLINE/);
 assert.ok(h.cacheReads.some(x=>x.ignoreSearch));
 for(const path of ['/app-parts/part-001.html','/app.1234abcd.html','/release.json']){
   const skipped=await h.fetchOffline(h.req(path));
   assert.equal(skipped,null,'release integrity must remain owned by snapshot loader: '+path);
 }
});

test('Phase 08 excludes API/authenticated requests from offline shell responses',async()=>{
 const h=offlineServiceWorker({'./index.html':new Response('cached shell')});
 assert.equal(await h.fetchOffline(h.req('/api/private')) ,null);
 assert.equal(await h.fetchOffline(h.req('/settings','document','navigate',{'authorization':'Bearer test'})),null);
 assert.equal(h.cacheReads.length,0,'private requests must never read shell cache');
});

test('Phase 08 offline cache activation preserves snapshots and user assets',async()=>{
 const h=offlineServiceWorker();
 let completion;
 h.listeners.activate({waitUntil:p=>completion=p});
 await completion;
 assert.deepEqual(h.deleted,['second-brain-shell-v11']);
 assert.ok(!h.deleted.some(x=>x.startsWith('omnios-user-assets-')||x.startsWith('omnios-app-snapshot-')));
});

test('Phase 08 missing uncached offline asset fails closed rather than returning unrelated HTML',async()=>{
 const h=offlineServiceWorker();
 const result=await h.fetchOffline(h.req('/styles/omnios-ux-phase07.css','style','cors'));
 assert.equal(result.type,'error');
 assert.equal(h.cacheWrites.length,0);
});
