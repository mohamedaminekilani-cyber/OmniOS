import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';

const fragment=readFileSync('app-parts/part-009.html','utf8');
const script=fragment.match(/<script id="omnios-kitchen-interactions-js">([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Kitchen interactions are included in the release fragment');

function fixture(){
  const dom=new JSDOM('<!doctype html><html><body><button id="v35-db-clear-snaps">Clear restore points</button><div class="tab-btns" id="tabs"></div></body></html>',{runScripts:'outside-only',pretendToBeVisual:true,url:'https://example.test'});
  const {window:w}=dom;
  w.matchMedia=()=>({matches:false});
  w.confirm=()=>true;
  const timers=[];
  w.setTimeout=(callback)=>{timers.push(callback);return timers.length};
  w.clearTimeout=(id)=>{timers[id-1]=null};
  w.eval(script);
  return {dom,w,timers,btn:w.document.getElementById('v35-db-clear-snaps'),tabs:w.document.getElementById('tabs')};
}

test('bulk recovery deletion rejects ordinary pointer clicks but allows deliberate hold',()=>{
  const f=fixture();let deleted=0;
  f.btn.addEventListener('click',()=>{deleted++});
  f.btn.dispatchEvent(new f.w.MouseEvent('click',{bubbles:true,detail:1}));
  assert.equal(deleted,0,'ordinary pointer click must not clear backups');
  f.btn.dispatchEvent(new f.w.MouseEvent('pointerdown',{bubbles:true,button:0}));
  assert.equal(f.btn.classList.contains('omni-kitchen-holding'),true);
  const holdTimer=f.timers.find(Boolean);
  assert.equal(typeof holdTimer,'function');
  holdTimer();
  assert.equal(deleted,1,'completed hold should dispatch exactly one authorized click');
  f.dom.window.close();
});

test('keyboard and assistive activation uses native confirmation fallback',()=>{
  const f=fixture();let deleted=0,confirmed=0;
  f.w.confirm=()=>{confirmed++;return true};
  f.btn.addEventListener('click',()=>{deleted++});
  f.btn.click();
  assert.equal(confirmed,1);
  assert.equal(deleted,1);
  f.dom.window.close();
});

test('scroll fade reflects actual overflow and hides when no scroll remains',()=>{
  const f=fixture();
  Object.defineProperty(f.tabs,'clientWidth',{configurable:true,value:100});
  Object.defineProperty(f.tabs,'scrollWidth',{configurable:true,value:240});
  f.tabs.scrollLeft=0;
  f.tabs.dispatchEvent(new f.w.Event('scroll',{bubbles:true}));
  assert.equal(f.tabs.dataset.omniKitchenFade,'right');
  f.tabs.scrollLeft=65;
  f.tabs.dispatchEvent(new f.w.Event('scroll',{bubbles:true}));
  assert.equal(f.tabs.dataset.omniKitchenFade,'both');
  f.tabs.scrollLeft=140;
  f.tabs.dispatchEvent(new f.w.Event('scroll',{bubbles:true}));
  assert.equal(f.tabs.dataset.omniKitchenFade,'left');
  f.dom.window.close();
});
