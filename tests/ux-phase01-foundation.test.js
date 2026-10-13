import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
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
