import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,webcrypto} from 'node:crypto';

const source=fs.readFileSync('index.html','utf8');
const start=source.indexOf('    async function readReleasePointer(key){');
const end=source.indexOf('    async function requestReleaseFile(path){',start);
if(start<0||end<0)throw Error('Verified release functions not found in index loader');
const functions=source.slice(start,end);
const origin='https://omnios.example.test/';
const activeKey=origin+'__active_release__';
const backupKey=origin+'__previous_valid_release__';
const release=(text)=>{
 const sha256=createHash('sha256').update(text).digest('hex');
 return {version:1,sha256,bytes:Buffer.byteLength(text),file:'app.'+sha256.slice(0,20)+'.html'};
};
function setup(){
 const db=new Map(),reads=[],writes=[];
 const releaseCache={
   async match(key){reads.push(key);return db.get(key)?.clone()},
   async put(key,value){writes.push(key);db.set(key,value.clone())}
 };
 const cacheRelease=async(key,response)=>releaseCache.put(key,response);
 const loader=vm.runInNewContext('(()=>{'+functions+'return {installed,readReleasePointer,rememberRelease,verified}})()',
   {releaseCache,cacheRelease,activeKey,backupKey,crypto:webcrypto,TextEncoder,Response,URL,location:{href:origin}},
   {filename:'index-release-recovery.js'});
 const set=async(m,text,key=activeKey)=>{
   await releaseCache.put(origin+m.file,new Response(text));
   await releaseCache.put(key,new Response(JSON.stringify(m)));
 };
 return {db,reads,writes,releaseCache,loader,set};
}
test('Phase 08.4 cached startup accepts only checksum-verified active releases',async()=>{
 const h=setup(),m=release('<main>valid</main>');
 await h.set(m,'<main>valid</main>');
 const loaded=await h.loader.installed();
 assert.equal(loaded.text,'<main>valid</main>');
 assert.equal(loaded.m.sha256,m.sha256);
 assert.equal(h.reads.includes(activeKey),true);
 assert.equal(h.reads.includes(backupKey),false);
});
test('Phase 08.4 interrupted update keeps the last active release and fallback',async()=>{
 const h=setup(),v1=release('version one'),v2=release('version two');
 await h.set(v1,'version one');
 await h.releaseCache.put(origin+v2.file,new Response('version two'));
 // Download alone does not advance the active release before activation.
 assert.equal((await h.loader.installed()).m.sha256,v1.sha256);
 await h.loader.rememberRelease(v2);
 assert.equal((await h.loader.installed()).m.sha256,v2.sha256);
 const backup=await h.loader.readReleasePointer(backupKey);
 assert.equal(backup.m.sha256,v1.sha256);
 // Corrupt the active payload after the update. Recover ONLY verified backup.
 await h.releaseCache.put(origin+v2.file,new Response('TAMPERED'));
 assert.equal((await h.loader.installed()).m.sha256,v1.sha256);
});
test('Phase 08.4 damaged active pointer recovers a valid older release without write or fetch',async()=>{
 const h=setup(),v=release('signed old payload');
 await h.set(v,'signed old payload',backupKey);
 await h.releaseCache.put(activeKey,new Response('not-json'));
 assert.equal((await h.loader.installed()).m.sha256,v.sha256);
 assert.equal(h.writes.length,3,'read-only recovery never mutates cache');
});
test('Phase 08.4 fails closed if both releases are invalid or absent',async()=>{
 const h=setup(),old=release('old'),newer=release('new');
 assert.equal(await h.loader.installed(),null);
 await h.set(old,'tampered old',backupKey);
 await h.set(newer,'tampered new',activeKey);
 assert.equal(await h.loader.installed(),null);
});
test('Phase 08.4 rejects mismatched content-addressed file names despite valid hashes',async()=>{
 const h=setup(),m=release('safe app');
 const swapped={...m,file:'app.'+'0'.repeat(20)+'.html'};
 assert.equal(await h.loader.verified(swapped,'safe app'),false);
 assert.equal(await h.loader.verified(m,'safe app'),true);
 await h.set(swapped,'safe app',backupKey);
 assert.equal(await h.loader.installed(),null);
});
test('Phase 08.4 keeps legacy snapshot and user data unrelated to release rollback',()=>{
 assert.match(source,/SNAPSHOT_PREFIX='omnios-app-snapshot-v1-'/);
 assert.match(source,/USER_ASSET_CACHE='omnios-user-assets-v1'/);
 assert.match(source,/const saved=await installed\(\)\.catch\(\(\)=>null\)/);
 assert.match(source,/const loaded=saved\|\|await fetchLatest\(\{activate:true\}\)/);
 assert.doesNotMatch(functions,/localStorage\.(?:clear|removeItem)|indexedDB\.deleteDatabase/);
});
