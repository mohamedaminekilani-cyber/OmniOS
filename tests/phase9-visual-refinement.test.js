import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const brand=fs.readFileSync('app-parts/part-007.html','utf8');
const final=fs.readFileSync('app-parts/part-028.html','utf8');
const first=fs.readFileSync('app-parts/part-001.html','utf8');
const loader=fs.readFileSync('index.html','utf8');
const css=final.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1]||'';
const p8=css.indexOf('END OMNIOS PHASE 6 / REMAINING MODULES / v1');
const p9=css.indexOf('OMNIOS PHASE 9 / BRAND + MOBILE DENSITY / v1');
const own=css.slice(p9);

test('Phase 9 remains scoped inside Classic-switchable flat design',()=>{
 assert.ok(p8>=0 && p9>p8);
 assert.ok(own.includes('END OMNIOS PHASE 9 / BRAND + MOBILE DENSITY / v1'));
 assert.ok(final.includes("css.disabled=mode==='classic'"));
 assert.doesNotMatch(own,/MutationObserver|fetch\(|localStorage|linear-gradient|box-shadow:[^;]*rgba/);
 for(const v of ['.mobile-nav.omr-mobile-dock','.v38-month-nav','.org-hero','.brand54-preview'])
  assert.ok(own.includes(v),'Missing '+v);
});

test('Branding fresh install and untouched legacy preset default to OmniOS without overwriting custom names',()=>{
 const start=brand.indexOf('const BRAND54_DEFAULTS=');
 const stop=brand.indexOf('function clamp54(',start);
 assert.ok(start>=0&&stop>start);
 const js=brand.slice(start,stop);
 const cases=[
  [{},'OmniOS','Personal OS'],
  [{settings:{appearance:{branding:{title:'Second Brain',tagline:'Ultimate Life Planner',mode:'text'}}}},'OmniOS','Personal OS'],
  [{settings:{appearance:{branding:{title:'Research Studio',tagline:'My work',font:'serif'}}}},'Research Studio','My work'],
  [{settings:{appearance:{branding:{title:'Second Brain',tagline:'Ultimate Life Planner',font:'serif'}}}},'Second Brain','Ultimate Life Planner'],
  [{settings:{appearance:{branding:{title:'Second Brain',tagline:'Ultimate Life Planner'}}},brandingLogo:'data:image/png;base64,example'},'Second Brain','Ultimate Life Planner']
 ];
 for(const [initial,title,tagline] of cases){
  const dom=new JSDOM('<!doctype html><title>Test</title>',{runScripts:'outside-only'});
  const w=dom.window;
  w.eval('var state='+JSON.stringify(initial)+';'+js+';window.__result=brand54()');
  assert.equal(w.__result.title,title);
  assert.equal(w.__result.tagline,tagline);
  dom.window.close();
 }
});

test('Welcome product name respects custom branding and escapes text',()=>{
 const i=final.indexOf('<script id="omnios-welcome-screen-js">');
 const j=final.indexOf('</script>',i);
 assert.ok(i>=0&&j>i);
 const code=final.slice(i,j);
 assert.ok(code.includes("x.s?.settings?.appearance?.branding?.title"));
 assert.ok(code.includes("? 'OmniOS'")||code.includes("?'OmniOS'"));
 assert.match(code,/E\(\(x\.s\?\.settings\?\.appearance\?\.branding/);
});

test('Mobile dock has one canonical SVG or custom icon and readable labels',()=>{
 assert.ok(first.includes('class="mobile-nav omr-mobile-dock"'));
 assert.match(own,/\.v48-mobile-icon/);
 assert.match(own,/\.omni-mobile-custom-icon\.omni-custom-icon-active/);
 assert.match(own,/\.nav-label/);
 assert.match(own,/grid-template-columns:repeat\(5,minmax\(0,1fr\)\)!important/);
 assert.match(own,/font-size:11px!important/);
});

test('Finance month controls are arranged in one row on mobile',()=>{
 assert.match(own,/grid-template-columns:36px max-content minmax\(0,1fr\) 36px!important/);
 for(const id of ['v38-prev-month','v38-today-month','v38-next-month'])
  assert.ok(own.includes('#'+id));
 assert.ok(own.includes('grid-template-rows:44px!important'));
});

test('Product-facing boot, notifications, and app defaults use OmniOS',()=>{
 assert.ok(loader.includes('Loading OmniOS'));
 assert.ok(!loader.includes('Loading Second Brain'));
 assert.ok(brand.includes("title:'OmniOS'"));
 assert.ok(brand.includes("tagline:'Personal OS'"));
 const pwa=fs.readFileSync('pwa-personalization.js','utf8');
 assert.ok(pwa.includes('OmniOS daily summary'));
});
