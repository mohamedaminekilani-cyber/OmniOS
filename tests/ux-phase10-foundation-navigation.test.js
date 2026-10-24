import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const foundation=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
const navigation=fs.readFileSync('js/omnios-navigation-phase02.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');
test('Phase 10.1 theme aliases remain backwards compatible',()=>{
 for(const token of ['--ux-border-subtle','--ux-surface-raised','--ux-focus','--ux-control-height','--ux-header-gap','--ux-nav-gap'])
   assert.ok(foundation.includes(token),token);
 for(const legacy of ['--bg-elevated','--border-light','--bg-hover','--omx-focus'])assert.ok(foundation.includes('var('+legacy));
 assert.match(foundation,/\.ux-button-secondary/);
 assert.match(foundation,/\.ux-button-ghost/);
 assert.match(foundation,/\.ux-button-danger/);
 assert.doesNotMatch(foundation.slice(foundation.indexOf('UX Phase 10.1')),/!important/);
});
test('Phase 10.2 retains original five mobile destinations but makes Today direct',()=>{
 assert.match(navigation,/GROUPS\.forEach\(g=>\{/);
 assert.match(navigation,/if\(g\.id==='today'\)/);
 assert.match(navigation,/if\(visibleView\(\)==='today'\)showDrawer\('today',b\)/);
 assert.match(navigation,/else navigate\('today'\)/);
 assert.match(navigation,/b\.setAttribute\('aria-label','Go to Today'\)/);
 assert.match(navigation,/showDrawer\(g\.id,b\)/);
 assert.match(navigation,/dock\.appendChild\(capture\)/);
 assert.match(navigation,/function closeDrawer\(/);
 assert.doesNotMatch(navigation,/localStorage\.(?:clear|setItem|removeItem)|indexedDB/);
 assert.doesNotThrow(()=>new vm.Script(navigation));
});
test('Phase 10.2 mobile controls keep a readable label and tokenized target',()=>{
 assert.match(css,/\.ux02-mobile-nav \.ux02-tab-label\{font-size:12px/);
 assert.match(css,/\.ux02-mobile-tab\{min-height:var\(--ux-control-height\)/);
 assert.match(css,/\.ux02-side-toggle\{\s*gap:var\(--ux-nav-gap\)/);
});
