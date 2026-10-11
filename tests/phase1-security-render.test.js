import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {JSDOM} from 'jsdom';

const p2=fs.readFileSync('app-parts/part-002.html','utf8');
const p7=fs.readFileSync('app-parts/part-007.html','utf8');
const p8=fs.readFileSync('app-parts/part-008.html','utf8');

function section(text,from,to){
  const a=text.indexOf(from);
  assert.ok(a>=0,'Missing source section: '+from);
  const b=text.indexOf(to,a+from.length);
  assert.ok(b>a,'Missing end of source section: '+to);
  return text.slice(a,b);
}
const png='data:image/png;base64,aGVsbG8=';
function context(){
  const dom=new JSDOM('<!doctype html><html><body></body></html>',{url:'https://omnios.example/'});
  return {
    dom,
    env:vm.createContext({
      document:dom.window.document,
      location:dom.window.location,
      URL,
      arr:x=>Array.isArray(x)?x:[],
      console,
      documentElement:dom.window.document.documentElement
    })
  };
}
const attachmentSource=section(p2,'function safeAttachmentURL(src){','  function compressImage(');
const photoSource=section(p7,'function safePhotoURL49(src){','function photoField49(');
const dietSource=section(p2,'function safeDietImageURL(src){','  function showDietInspector(');
const mediaSource=section(p7,'function mediaNode49(', 'let lastNote49=null;');

test('attachment URLs reject non-image data, script protocols and HTML attribute attacks',()=>{
  const {dom,env}=context();
  vm.runInContext(attachmentSource,env);
  assert.equal(vm.runInContext("safeAttachmentURL('javascript:alert(1)')",env),'');
  assert.equal(vm.runInContext("safeAttachmentURL('data:image/svg+xml,<svg onload=alert(1)>')",env),'');
  assert.equal(vm.runInContext("safeAttachmentURL('data:text/html,<script>alert(1)</script>')",env),'');
  assert.equal(vm.runInContext("safeAttachmentURL('http://remote.example/logo.png')",env),'');
  assert.equal(vm.runInContext("safeAttachmentURL('https://images.example/photo.png')",env),'https://images.example/photo.png');
  assert.equal(vm.runInContext("safeAttachmentURL('data:image/png;base64,aGVsbG8=')",env),png);
  env.malicious='https://example.com/a.png" onerror="alert(1)';
  const html=vm.runInContext("imgTags([malicious,'javascript:alert(1)','data:image/png;base64,aGVsbG8='])",env);
  dom.window.document.body.innerHTML=html;
  assert.equal(dom.window.document.querySelectorAll('img').length,2);
  assert.equal(dom.window.document.querySelectorAll('[onerror]').length,0);
  assert.equal(dom.window.document.querySelectorAll('[onclick]').length,0);
  assert.equal(dom.window.document.querySelector('img:last-child').getAttribute('src'),png);
});

test('diet image gallery escapes attributes and excludes script or SVG payloads',()=>{
  const {dom,env}=context();
  vm.runInContext(dietSource,env);
  assert.equal(vm.runInContext("safeDietImageURL('javascript:alert(1)')",env),'');
  assert.equal(vm.runInContext("safeDietImageURL('data:image/svg+xml,<svg/>')",env),'');
  env.malicious='https://images.example/photo.png" onerror="alert(1)';
  const html=vm.runInContext("imagesHtml([malicious,'javascript:alert(1)','data:image/png;base64,aGVsbG8='])",env);
  dom.window.document.body.innerHTML=html;
  assert.equal(dom.window.document.querySelectorAll('img').length,2);
  assert.equal(dom.window.document.querySelectorAll('[onerror]').length,0);
  assert.equal(dom.window.document.querySelector('img:last-child').getAttribute('src'),png);
  dom.window.close();
});

test('native image cards use DOM nodes and reject dangerous image URLs',()=>{
  const {dom,env}=context();
  vm.runInContext(photoSource+'\n'+mediaSource,env);
  env.png=png;
  assert.equal(vm.runInContext("safePhotoURL49('javascript:alert(1)')",env),'');
  assert.equal(vm.runInContext("safePhotoURL49('data:image/svg+xml,<svg/>')",env),'');
  assert.equal(vm.runInContext("safePhotoURL49(png)",env),png);
  assert.equal(vm.runInContext("mediaNode49('javascript:alert(1)')",env),null);
  const el=vm.runInContext("mediaNode49(png, 'v49-row-image', true)",env);
  assert.equal(el.tagName,'IMG');
  assert.equal(el.className,'v49-row-image');
  assert.equal(el.getAttribute('src'),png);
  assert.equal(el.attributes.length,3);
  const wrap=vm.runInContext("mediaNode49(png,'v49-task-image')",env);
  assert.equal(wrap.className,'v49-task-image');
  assert.equal(wrap.firstElementChild.tagName,'IMG');
  assert.equal(wrap.querySelector('[onerror]'),null);
  dom.window.close();
});

test('photo editor keeps its remove and reorder interactions without HTML interpolation',()=>{
  const {dom,env}=context();
  vm.runInContext(photoSource,env);
  const field=dom.window.document.createElement('div');
  field.innerHTML='<div class="v49-photo-strip"></div><div class="v49-photo-empty"></div>';
  env.field=field;
  env.draft={images:[png,'javascript:alert(1)', 'https://images.example/2.png']};
  vm.runInContext('renderPhotos49(field,draft)',env);
  assert.equal(field.querySelectorAll('img').length,2);
  assert.equal(field.querySelectorAll('[onerror]').length,0);
  const secondary=field.querySelector('[data-v49-photo="2"]');
  secondary.click();
  assert.equal(env.draft.images[0],'https://images.example/2.png');
  assert.equal(field.querySelectorAll('img').length,2);
  field.querySelector('[data-v49-remove="0"]').click();
  assert.equal(env.draft.images[0],png);
  dom.window.close();
});

test('task-board drag placeholder uses text-safe DOM construction',()=>{
  assert.doesNotMatch(p8,/insertAdjacentHTML\(/);
  assert.match(p8,/label\.textContent='Move task to '\+meta\.title/);
  assert.match(p8,/slot\.append\(icon,title,label\)/);
  assert.match(p8,/zone\.appendChild\(slot\)/);
});

test('known scanned HTML sinks are removed, while legitimate design classes remain',()=>{
  assert.doesNotMatch(p7,/insertAdjacentHTML\(/);
  assert.match(p7,/v49-native-media/);
  assert.match(p7,/v49-task-image/);
  assert.match(p7,/v49-photo-remove/);
  assert.match(p2,/function safeAttachmentURL\(src\)/);
  assert.match(p2,/function imageAttrEscape\(value\)/);
  assert.doesNotMatch(p2,/<img class="image-thumb" src="\$\{src\}"/);
  assert.doesNotMatch(p2,/<img src="\$\{src\}"/);
  assert.match(p2,/escapeHtml\(String\(e\.notes\)\.substring\(0,70\)\)/);
});
