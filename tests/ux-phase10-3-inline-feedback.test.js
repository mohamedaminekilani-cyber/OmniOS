import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('js/omnios-modules-phase07.js','utf8');
const from=source.indexOf('const fieldMessages=new WeakMap();');
const to=source.indexOf('function refresh(){',from);
if(from<0||to<from)throw Error('Cannot locate Phase 10 inline feedback');
function setup(){
  const doc={createElement:tag=>new MockElement(tag)};
  const handlers=vm.runInNewContext('(()=>{'+source.slice(from,to)+'return {reportFieldError,clearFieldError}})()', {document:doc,WeakMap});
  return handlers;
}
class MockElement{
 constructor(tag){this.tagName=tag;this.attrs=new Map();this.textContent='';this.deleted=false;this.sibling=null;this.parentNode=null;}
 setAttribute(n,v){this.attrs.set(n,String(v))}
 getAttribute(n){return this.attrs.has(n)?this.attrs.get(n):null}
 hasAttribute(n){return this.attrs.has(n)}
 removeAttribute(n){this.attrs.delete(n)}
 insertAdjacentElement(position,node){assert.equal(position,'afterend');this.sibling=node;node.parentNode={removeChild:x=>{assert.equal(x,node);x.deleted=true;x.parentNode=null}}}
 remove(){this.deleted=true}
}
test('Phase 10.3 accessible error preserves original aria-describedby and invalid state',()=>{
 const {reportFieldError,clearFieldError}=setup();
 const input=new MockElement('input');
 input.setAttribute('aria-describedby','existing-hint');
 assert.equal(reportFieldError(input,'A value is required'),true);
 const node=input.sibling;
 assert.equal(node.textContent,'A value is required');
 assert.equal(node.getAttribute('role'),'alert');
 assert.equal(input.getAttribute('aria-invalid'),'true');
 assert.equal(input.getAttribute('aria-describedby'),'existing-hint '+node.id);
 reportFieldError(input,'Please enter a number');
 assert.equal(input.sibling,node,'Re-use the same feedback node without duplicate messages');
 assert.equal(node.textContent,'Please enter a number');
 clearFieldError(input);
 assert.equal(input.getAttribute('aria-describedby'),'existing-hint');
 assert.equal(input.hasAttribute('aria-invalid'),false);
 assert.equal(node.deleted,true);
});
test('Phase 10.3 clears only owned accessibility state',()=>{
 const {reportFieldError,clearFieldError}=setup();
 const field=new MockElement('input');
 field.setAttribute('aria-invalid','false');
 reportFieldError(field,'Invalid input');
 clearFieldError(field);
 assert.equal(field.getAttribute('aria-invalid'),'false');
 assert.equal(field.hasAttribute('aria-describedby'),false);
 assert.equal(reportFieldError(field,'   '),false);
 assert.equal(reportFieldError(null,'oops'),false);
});
test('Phase 10.3 exports voluntary feedback without touching existing persistence or routes',()=>{
 assert.match(source,/window\.OmniModules07=\{refresh,reportFieldError,clearFieldError,views:/);
 assert.doesNotMatch(source.slice(from,to),/localStorage|indexedDB|saveState|innerHTML|window\.switchView/);
 assert.doesNotThrow(()=>new vm.Script(source));
 const css=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
 assert.match(css,/\.ux-field-feedback-error/);
 assert.ok(css.includes('[aria-invalid="true"]'));
});
