import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {sourceRelease} from '../scripts/release-source.mjs';

const loader=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
const build=fs.readFileSync('scripts/build.mjs','utf8');

test('UX stylesheet is inserted in assembled application document exactly once',()=>{
  const marker='id="omnios-ux-foundation-styles"';
  assert.equal(loader.split(marker).length-1,1);
  assert.match(loader,/function carryLoaderIntoApp\(html\)/);
  assert.match(loader,/out=out\.replace\(\/<\\\/head>\/i,gateCss\+currentUiAuthorityCss/);
  assert.match(loader,/href="\.\/styles\/omnios-ux-foundation\.css"/);
});
test('built distribution contains UX stylesheet through styles directory',()=>{
  assert.match(build,/['"]icons['"],['"]data['"],['"]styles['"]/);
});
test('foundation retains keyboard and reduced motion support',()=>{
  assert.match(css,/:focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(css,/--ux-target:44px/);
});
test('legacy bridge does not introduce important declarations or override theme surface ownership',()=>{
  const bridge=css.split('/* Shared production-shell bridge.')[1];
  assert.ok(bridge,'legacy compatibility section missing');
  assert.doesNotMatch(bridge,/:[^;{}]*!important/i);
  assert.doesNotMatch(bridge,/(?:background-color|border-color)\s*:/i);
});
test('shared components are opt-in and preserve canonical source release manifest',()=>{
  assert.match(css,/\.ux-page-header/);
  assert.match(css,/\.ux-button/);
  const manifest=JSON.parse(fs.readFileSync('source-release.json','utf8'));
  assert.equal(manifest.sha256,sourceRelease().manifest.sha256);
});

test('existing page header and tab selectors have a non-destructive compatibility bridge',()=>{
  for(const selector of ['.v35-page-head','.v58-page-head','.omx-page-heading','.v38-finance-head','.v35-segmented','.bib-tabs']){
    assert.ok(css.includes(selector),'Missing existing UI compatibility selector: '+selector);
  }
  const section=css.split('/* Phase 01: page-header and tab compatibility')[1];
  assert.ok(section);
  assert.doesNotMatch(section,/!important/);
  assert.doesNotMatch(section,/display\s*:\s*none/i);
});

test('PWA shell precaches the UX stylesheet for offline use',()=>{
  const sw=fs.readFileSync('sw.js','utf8');
  assert.match(sw,/second-brain-shell-v5/);
  assert.match(sw,/\.\/styles\/omnios-ux-foundation\.css/);
});

test('injected loader authority is valid JavaScript and closes its HTML script tag',()=>{
  const marker='  const currentUiAuthorityScript=';
  const start=loader.indexOf(marker);
  const end=loader.indexOf(';\n  const bootHtml=',start);
  assert.ok(start>=0&&end>start,'missing loader-injected authority source');
  const expression=loader.slice(start+marker.length,end);
  const emitted=vm.runInNewContext(expression);
  assert.match(emitted,/^<script\\b/);
  assert.match(emitted,/<\\/script>$/);
  assert.doesNotMatch(emitted,/<\\\\\\/script>/);
  const inner=emitted.replace(/^<script[^>]*>/,'').replace(/<\\/script>$/,'');
  assert.doesNotThrow(()=>new vm.Script(inner));
});
