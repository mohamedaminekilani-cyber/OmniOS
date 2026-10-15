import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync('js/omnios-today-phase03.js','utf8');

test('Phase 08 refreshes Today decorations only for Today/Dashboard routes and real rerenders',()=>{
  const microtasks=[],frames=[],delayed=[],listeners={},observed=[],routed=[];
  const today={
    classList:{toggle(){today.toggles=(today.toggles||0)+1}},
    querySelector(selector){return selector==='#ux03-today-controls'?{previousElementSibling:null}:null}
  };
  const dashboard={querySelector(selector){return selector==='#ux03-dashboard-return'?{}:null}};
  const document={
    readyState:'loading',
    addEventListener(name,fn){listeners[name]=fn},
    querySelector(selector){return {'#view-today':today,'#view-dashboard':dashboard}[selector]||null}
  };
  const window={
    switchView(id){routed.push(id);return id},
    addEventListener(){}
  };
  class Observer {
    constructor(fn){this.fn=fn}
    observe(node,options){observed.push({node,options,observer:this})}
  }
  vm.runInNewContext(js,{document,window,MutationObserver:Observer,console,
    queueMicrotask:fn=>microtasks.push(fn),
    requestAnimationFrame:fn=>frames.push(fn),
    setTimeout:(fn,ms)=>{delayed.push({fn,ms})}},
    {filename:'omnios-today-phase03.js'});
  listeners.DOMContentLoaded();
  assert.equal(observed.length,2);
  assert.ok(observed.every(x=>x.options.childList===true&&!x.options.subtree));
  const flush=()=>{while(microtasks.length)microtasks.shift()()};
  flush();
  const initial=today.toggles;
  for(const id of ['notes','diet','budget','workout','life-hub','master-calendar']){
    assert.equal(window.switchView(id),id);
  }
  assert.equal(microtasks.length,0,'unrelated navigation must not schedule decorations');
  assert.equal(frames.length,0,'unrelated navigation must not schedule a frame');
  assert.equal(delayed.length,0);
  assert.equal(today.toggles,initial);
  assert.deepEqual(routed,['notes','diet','budget','workout','life-hub','master-calendar']);
  window.switchView('today');
  assert.equal(microtasks.length,1);
  assert.equal(frames.length,1);
  flush();assert.equal(today.toggles,initial+1);
  frames.shift()();flush();
  assert.equal(today.toggles,initial+2);
  window.switchView('dashboard');
  assert.equal(delayed.length,1);
  assert.equal(delayed[0].ms,120);
  const before=today.toggles;
  flush();assert.equal(today.toggles,before+1);
  // The original legacy renderer may replace a root without switchView.
  observed[0].observer.fn();
  flush();
  assert.equal(today.toggles,before+2);
});

test('Phase 08 preserves original Today command routing and source-of-truth writes',()=>{
  assert.match(js,/previousSwitch\.apply\(this,args\)/);
  assert.match(js,/args\[0\]==='today'\|\|args\[0\]==='dashboard'/);
  assert.match(js,/requestAnimationFrame\(schedule\)/);
  assert.match(js,/setTimeout\(schedule,120\)/);
  assert.doesNotMatch(js,/localStorage|indexedDB|saveState|\.innerHTML\s*=/);
  assert.doesNotThrow(()=>new vm.Script(js));
});
