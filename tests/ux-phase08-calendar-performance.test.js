import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('js/omnios-calendar-phase05.js','utf8');
function harness(){
 const callbacks=new Map(),microtasks=[],frames=[],observers=[];
 const makeNode=()=>{
   const attrs=new Map(),properties=new Map();
   const node={
     writes:0,hidden:false,dataset:{},
     classList:{contains:()=>false},
     style:{
       getPropertyValue:name=>properties.get(name)?.value||'',
       getPropertyPriority:name=>properties.get(name)?.priority||'',
       setProperty(name,value,priority=''){properties.set(name,{value,priority});node.writes++},
       removeProperty(name){properties.delete(name);node.writes++}
     },
     getAttribute:name=>attrs.get(name)??null,
     hasAttribute:name=>attrs.has(name),
     setAttribute(name,value){attrs.set(name,String(value));node.writes++},
     removeAttribute(name){attrs.delete(name);node.writes++}
   };
   return node;
 };
 const center=makeNode(),button=makeNode(),period=makeNode(),toolbar=makeNode();
 button.dataset.v36Mode='month';button.textContent='Month';
 toolbar.querySelector=selector=>selector==='.v36-cal-center'?center:selector==='.v36-month-grid'?null:selector==='.v36-cal-period'?period:null;
 toolbar.querySelectorAll=selector=>selector==='[data-v36-mode]'?[button]:[];
 const host={querySelector:selector=>selector==='.v36-cal-toolbar'?toolbar:null};
 const document={
   readyState:'loading',
   addEventListener(name,cb){callbacks.set(name,cb)},
   querySelector(selector){return selector==='#master-calendar-content'?host:selector==='#view-master-calendar.active'?{}:null}
 };
 const window={matchMedia:()=>({matches:true}),addEventListener(){}};
 class Observer{
   constructor(fn){this.fn=fn;observers.push(this)}
   observe(target,options){this.target=target;this.options=options}
 }
 const context={window,document,MutationObserver:Observer,Date,Math,Number,masterCalendarMode:'month',
   queueMicrotask:fn=>microtasks.push(fn),requestAnimationFrame:fn=>frames.push(fn),console};
 vm.runInNewContext(source,context,{filename:'omnios-calendar-phase05.js'});
 callbacks.get('DOMContentLoaded')();
 const drainMicrotasks=()=>{while(microtasks.length)microtasks.shift()()};
 const frame=()=>{const fn=frames.shift();if(fn)fn()};
 return {window,document,center,button,period,toolbar,host,microtasks,frames,observers,drainMicrotasks,frame};
}

test('Phase 08 decorates Calendar in the microtask but skips unchanged duplicate frame',()=>{
 const h=harness();
 assert.equal(h.microtasks.length,1);
 assert.equal(h.frames.length,1);
 h.drainMicrotasks();
 const firstWrites=h.center.writes+h.button.writes+h.toolbar.writes;
 assert.ok(firstWrites>0);
 assert.equal(h.button.getAttribute('aria-pressed'),'true');
 assert.equal(h.center.style.getPropertyValue('display'),'flex');
 h.frame();
 const secondWrites=h.center.writes+h.button.writes+h.toolbar.writes;
 assert.equal(secondWrites,firstWrites,'unchanged UI should not get a second decoration');
 assert.equal(h.frames.length,0);
 assert.equal(h.observers.length,1);
 assert.equal(h.observers[0].target,h.host);
 assert.equal(h.observers[0].options.childList,true);
 assert.equal(h.observers[0].options.subtree,undefined);
});

test('Phase 08 coalesces repeated events and repairs a late legacy mobile suppression',()=>{
 const h=harness();
 h.drainMicrotasks();h.frame();
 for(let i=0;i<30;i++)h.window.OmniCalendar05.refresh();
 assert.equal(h.microtasks.length,1);
 assert.equal(h.frames.length,1);
 h.drainMicrotasks();
 // Another renderer hides the original V36 controls after the microtask.
 h.center.hidden=true;h.center.setAttribute('aria-hidden','true');
 h.button.hidden=true;h.button.style.setProperty('display','none','important');
 h.frame();
 assert.equal(h.center.hidden,false);
 assert.equal(h.center.getAttribute('aria-hidden'),null);
 assert.equal(h.center.style.getPropertyValue('display'),'flex');
 assert.equal(h.button.hidden,false);
 assert.equal(h.button.style.getPropertyValue('display'),'inline-flex');
 assert.equal(h.button.getAttribute('aria-pressed'),'true');
});

test('Phase 08 Calendar cleanup preserves source-of-truth and no persistence writes',()=>{
 assert.doesNotMatch(source,/localStorage|indexedDB|saveState|\.innerHTML\s*=/);
 assert.match(source,/function needsLateRepair\(\)/);
 assert.match(source,/if\(needsLateRepair\(\)\)decorate\(\)/);
 assert.match(source,/window\.renderMasterCalendar\(\)/);
 assert.doesNotThrow(()=>new vm.Script(source));
});
