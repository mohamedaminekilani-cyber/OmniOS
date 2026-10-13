import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync('js/omnios-navigation-phase02.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');
const loader=fs.readFileSync('index.html','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');
const sw=fs.readFileSync('sw.js','utf8');
const base=fs.readFileSync('app-parts/part-001.html','utf8');

test('Phase 02 navigation has four intents with stable landing destinations',()=>{
  assert.match(js,/id:'today', label:'Today'/);
  assert.match(js,/id:'plan', label:'Plan'/);
  assert.match(js,/id:'life', label:'Life'/);
  assert.match(js,/id:'library', label:'Library'/);
  for(const id of ['today','planner','life-hub','notes'])
    assert.ok(base.includes('data-view="'+id+'"'),'Missing preserved navigation route: '+id);
});
test('Phase 02 keeps legacy app routing and all original sidebar destination nodes',()=>{
  assert.match(js,/window\.switchView\(id\)/);
  assert.match(js,/nav\.replaceChildren\(fragment\)/);
  assert.match(js,/groups\[i\]\.rows\.push\(b\)/);
  assert.match(js,/if\(!accounted\.has\(id\)\)groups\[3\]\.rows\.push\(b\)/);
  assert.doesNotMatch(js,/localStorage\.(?:setItem|removeItem|clear)/);
  assert.doesNotMatch(js,/location\.(?:hash|href)\s*=/);
});
test('Phase 02 loader injects exactly one stylesheet and script into actual assembled document',()=>{
  assert.equal(loader.split('id="omnios-ux-phase02-styles"').length-1,1);
  assert.equal(loader.split('src="./js/omnios-navigation-phase02.js"').length-1,1);
  assert.match(loader,/function carryLoaderIntoApp\(html\)/);
  assert.match(css,/ux02-mobile-nav/);
  assert.match(css,/ux02-side-group/);
});
test('Phase 02 replaces legacy mobile dock only visually and delegates capture to existing Quick Add',()=>{
  assert.match(css,/\.mobile-nav\.omr-mobile-dock/);
  assert.match(js,/byId\('global-add-btn'\)/);
  assert.match(js,/button\.click\(\)/);
  assert.match(js,/capture\.addEventListener\('click',quickCapture\)/);
  assert.match(css,/#v55-capture-fab\{display:none!important\}/);
});
test('Phase 02 PWA cache includes script and stylesheet',()=>{
  assert.match(sw,/second-brain-shell-v6/);
  assert.ok(sw.includes("'./styles/omnios-ux-phase02.css'"));
  assert.ok(sw.includes("'./js/omnios-navigation-phase02.js'"));
});
test('Phase 02 navigation supports keyboard and dialog dismissal',()=>{
  assert.match(js,/e\.key==='Escape'/);
  assert.match(js,/e\.key==='Tab'/);
  assert.match(js,/aria-modal/);
  assert.match(js,/aria-current/);
});

test('Phase 02 Today group keeps Dashboard and Inbox reachable in mobile drawer',()=>{
  assert.match(js,/views:\['today','dashboard','inbox'\]/);
  assert.match(js,/b\.setAttribute\('aria-haspopup','dialog'\)/);
});

test('Phase 02 build ships navigation JavaScript in dist',()=>{
  assert.match(build,/['"]icons['"],['"]data['"],['"]js['"],['"]styles['"]/);
});
