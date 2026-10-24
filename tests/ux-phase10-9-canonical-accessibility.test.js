import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const js=fs.readFileSync('js/omnios-modules-phase07.js','utf8');
test('Phase 10 canonical Notes and Finance use explicit accessible action labels',()=>{
 for(const [selector,label] of [['#org-note-sort,#notes-sort','Sort notes'],['#org-note-new','Create a new note'],['#v38-add-txn','Add a transaction']]){
  assert.ok(js.includes(selector),selector);
  assert.ok(js.includes("setAttr("+(label==='Add a transaction'?'addTransaction':label==='Sort notes'?'sort':'addNote')+",'aria-label','"+label+"')"),label);
 }
});
test('Phase 10 accessibility adapter does not alter legacy business persistence',()=>{
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|innerHTML\s*=/);
 assert.doesNotMatch(js,/window\.(?:prompt|confirm|alert)\s*=/);
});
