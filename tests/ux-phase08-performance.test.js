import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const life=fs.readFileSync('js/omnios-life-hub-phase06.js','utf8');
const modules=fs.readFileSync('js/omnios-modules-phase07.js','utf8');
const attrNode=()=>({
  attrs:new Map(), dataset:{}, classList:{add(){},contains(){return false}},
  setAttribute(name,value){this.attrs.set(name,value);this.writes=(this.writes||0)+1},
  getAttribute(name){return this.attrs.has(name)?this.attrs.get(name):null},
  hasAttribute(name){return this.attrs.has(name)},
  removeAttribute(name){this.attrs.delete(name)}
});

test('Phase 08 Life Hub disconnects a detached V43 content observer',()=>{
  const q=[],callbacks={},observers=[];
  class Observer {
    constructor(fn){this.fn=fn;this.targets=[];this.disconnectCount=0;observers.push(this)}
    observe(target,options){this.targets.push({target,options})}
    disconnect(){this.disconnectCount++}
  }
  const shell=attrNode(),hero=attrNode(),rail=attrNode(),overview=attrNode();
  const links={previousElementSibling:hero};
  const content1=attrNode(),content2=attrNode();
  let content=content1;
  const root=attrNode();
  root.querySelector=selector=>({
    '.v43-life-shell':shell,'.v43-hero':hero,'.v43-life-rail':rail,
    '#v43-life-overview':overview,'#v43-life-content':content,
    '#ux06-life-links':links
  })[selector]||null;
  root.querySelectorAll=()=>[];
  root.addEventListener=()=>{};
  const document={
    readyState:'loading',
    addEventListener(name,cb){callbacks[name]=cb},
    getElementById(id){return id==='view-life-hub'?root:null}
  };
  const window={addEventListener(){}};
  vm.runInNewContext(life,{window,document,MutationObserver:Observer,
    queueMicrotask:cb=>q.push(cb),setTimeout,Event,console});
  callbacks.DOMContentLoaded();
  while(q.length)q.shift()();
  assert.equal(observers.length,2,'one root and one content observer');
  const original=observers[1];
  assert.equal(original.targets[0].target,content1);
  assert.deepEqual(original.targets[0].options,{childList:true});

  for(let i=0;i<5;i++){window.OmniLife06.refresh();while(q.length)q.shift()()}
  assert.equal(observers.length,2,'same content must reuse its observer');
  assert.equal(original.disconnectCount,0);
  content=content2;
  window.OmniLife06.refresh();
  while(q.length)q.shift()();
  assert.equal(original.disconnectCount,1,'obsolete content observer must disconnect');
  assert.equal(observers.length,3);
  assert.equal(observers[2].targets[0].target,content2);
  assert.equal(observers[2].disconnectCount,0);
  content=null;
  window.OmniLife06.refresh();
  while(q.length)q.shift()();
  assert.equal(observers[2].disconnectCount,1,'missing content must disconnect');
});

test('Phase 08 module decorators coalesce refreshes and skip unchanged ARIA writes',()=>{
  const q=[],callbacks={},observers=[];
  class Observer {
    constructor(fn){this.fn=fn;this.targets=[];observers.push(this)}
    observe(target,options){this.targets.push({target,options})}
  }
  const group=attrNode(),button=attrNode(),start=attrNode();
  button.textContent='Sessions';
  button.classList={contains(name){return name==='active'}};
  group.querySelectorAll=selector=>selector==='[data-workout-tab]'?[button]:[];
  const workout={querySelector(selector){
    if(selector==='.workout-tabs')return group;
    if(selector==='#workout-start-btn')return start;
    return null;
  }};
  const diet={querySelector(){return null}},budget={querySelector(){return null}},
    notes={querySelector(){return null}},habits={querySelector(){return null}};
  const roots={workout,diet,budget,notes,habits};
  const document={
    readyState:'loading',
    getElementById(id){return roots[id.replace(/^view-/,'')]||null},
    addEventListener(name,cb){callbacks[name]=cb}
  };
  const window={addEventListener(){}};
  vm.runInNewContext(modules,{window,document,MutationObserver:Observer,
    queueMicrotask:cb=>q.push(cb),requestAnimationFrame:()=>{},console});
  callbacks.DOMContentLoaded();
  assert.equal(observers.length,1,'one observer must cover all V41/V38/V40 roots');
  assert.deepEqual(observers[0].targets.map(x=>x.target),[diet,budget,notes]);
  assert.ok(observers[0].targets.every(x=>x.options.childList===true&&!x.options.subtree));
  while(q.length)q.shift()();
  const before=(group.writes||0)+(button.writes||0)+(start.writes||0);
  assert.ok(before>0);
  for(let i=0;i<10;i++)window.OmniModules07.refresh();
  assert.equal(q.length,1,'many events produce one pending microtask');
  while(q.length)q.shift()();
  assert.equal((group.writes||0)+(button.writes||0)+(start.writes||0),before,
    'same semantic state must not mutate DOM attributes');
  button.classList={contains(){return false}};
  window.OmniModules07.refresh();while(q.length)q.shift()();
  assert.equal(button.getAttribute('aria-pressed'),'false');
  assert.equal(button.writes,3,'only changed selected state should be written');
});

test('Phase 08 keeps original user data and renderer contracts untouched',()=>{
  assert.doesNotMatch(life+modules,/localStorage|indexedDB|\.innerHTML\s*=/);
  assert.doesNotMatch(life+modules,/subtree:true/);
  assert.match(life,/contentObserver\?\.disconnect\(\)/);
  assert.match(modules,/function setAttr\(/);
  assert.doesNotThrow(()=>new vm.Script(life));
  assert.doesNotThrow(()=>new vm.Script(modules));
});
