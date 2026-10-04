import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {webcrypto} from 'node:crypto';
import {JSDOM,VirtualConsole} from 'jsdom';
import {sourceRelease} from '../scripts/release-source.mjs';
const {html,manifest}=sourceRelease();
async function launch({source=false,corrupt=false,cacheFailure=false,badPointer=false}={}){
  let written='',failure='';const requests=[];
  const cache={async match(key){if(badPointer&&String(key).includes('__active_release__'))return new Response('invalid JSON');},async put(){if(cacheFailure)throw Error('Quota exceeded')}};
  const vc=new VirtualConsole();vc.on('error',e=>{failure=String(e)});
  const dom=new JSDOM(fs.readFileSync('index.html','utf8'),{url:'https://example.org/OmniOS/',runScripts:'dangerously',pretendToBeVisual:true,virtualConsole:vc,beforeParse(w){
    w.TextEncoder=TextEncoder;w.Response=Response;Object.defineProperty(w,'crypto',{value:webcrypto});
    w.caches={open:async()=>{if(cacheFailure)throw Error('Storage disabled');return cache}};
    w.document.open=()=>{};w.document.write=value=>{written=value};w.document.close=()=>{};
    w.fetch=async input=>{
      const path=new URL(input,'https://example.org/OmniOS/').pathname.replace('/OmniOS/','');requests.push(path);
      if(path==='release.json')return new Response(source?'missing':JSON.stringify(manifest),{status:source?404:200});
      if(path==='source-release.json')return new Response(JSON.stringify(manifest));
      if(path===manifest.file)return new Response(html+(corrupt?'tampered':''));
      if(manifest.parts.includes(path)||manifest.modules.includes(path))return new Response(fs.readFileSync(path,'utf8')+(corrupt&&path===manifest.parts[0]?'tampered':''));
      return new Response('',{status:404});
    };
  }});
  for(let i=0;i<100&&!written&&!failure;i++)await new Promise(r=>setTimeout(r,10));
  dom.window.close();return {written,failure,requests};
}
test('atomic deployment loads the verified application',async()=>{const r=await launch();assert.ok(r.written.includes('omnios-startup-gate'));assert.ok(r.written.includes('function saveState()'));assert.equal(r.failure,'')});
test('source-hosted Pages assembles exactly the same verified application',async()=>{const r=await launch({source:true});assert.ok(r.written.includes('function saveState()'));assert.equal(r.failure,'');assert.ok(manifest.parts.every(p=>r.requests.includes(p)));assert.ok(manifest.modules.every(p=>r.requests.includes(p)))});
test('a corrupted release never executes in either deployment format',async()=>{for(const source of [false,true]){const r=await launch({source,corrupt:true});assert.equal(r.written,'');assert.match(r.failure,/checksum/i)}});
test('disabled cache and malformed offline pointer do not block online startup',async()=>{for(const options of [{cacheFailure:true},{badPointer:true}]){const r=await launch(options);assert.ok(r.written.includes('function saveState()'));assert.equal(r.failure,'')}});

test('update prompt is mobile-safe and applies the verified build without relying on reload',()=>{
  const source=fs.readFileSync('index.html','utf8');
  assert.match(source,/bottom:calc\(var\(--ux-bottomnav-h,72px\) \+ 8px\)/);
  assert.match(source,/showUpdatePrompt\(next\.m,next\.text\)/);
  assert.match(source,/#v35-page-launcher\.open/);
  assert.match(source,/if\(!text\|\|!await verified\(m,text\)\)throw Error/);
  assert.match(source,/const nextHtml=carryLoaderIntoApp\(text\)/);
  assert.match(source,/document\.write\(nextHtml\)/);
  assert.doesNotMatch(source,/data-update-now[^]*?location\.reload\(\)/);
});
