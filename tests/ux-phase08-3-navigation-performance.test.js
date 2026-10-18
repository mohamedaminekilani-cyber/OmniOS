import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const nav=fs.readFileSync('js/omnios-navigation-phase02.js','utf8');
const start=nav.indexOf('  let syncQueued=false;');
const end=nav.indexOf('  function install(){',start);
if(start<0||end<0)throw Error('Phase 02 navigation scheduler missing');

test('Phase 08.3 coalesces multiple navigation triggers into exactly one DOM update',()=>{
  const queue=[],state={active:'today',groups:new Map(),buttons:[]};
  let current='today',reads=0;
  const visibleView=()=>{reads++;return current};
  const groupId=id=>id==='today'?'today':id==='budget'?'life':'library';
  const schedule=vm.runInNewContext('(()=>{'+nav.slice(start,end)+'return scheduleSync})()',
    {queueMicrotask:cb=>queue.push(cb),state,visibleView,groupId});
  for(let i=0;i<200;i++)schedule();
  assert.equal(queue.length,1);
  current='budget';
  queue.shift()();
  assert.equal(reads,1);
  assert.equal(state.active,'life');
  schedule();schedule();
  assert.equal(queue.length,1);
  queue.shift()();
  assert.equal(reads,2);
});
test('Phase 08.3 preserves immediate initial sync and existing deep-link triggers',()=>{
 assert.match(nav,/    sync\(\);\s*\n  }\s*\n  window\.OmniNav02/);
 assert.match(nav,/window\.addEventListener\('hashchange',\(\)=>scheduleSync\(\)\)/);
 assert.match(nav,/window\.addEventListener\('popstate',\(\)=>scheduleSync\(\)\)/);
 assert.match(nav,/const result=original\.apply\(this,arguments\);\s*scheduleSync\(\);/);
 assert.doesNotMatch(nav,/localStorage\.setItem|indexedDB|saveState/);
});
