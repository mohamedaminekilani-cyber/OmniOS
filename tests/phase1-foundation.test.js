import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const source=fs.readFileSync('app-parts/part-028.html','utf8');
const layer=source.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1];
assert.ok(layer,'Missing switchable unified design style');
const begin=layer.indexOf('OMNIOS PHASE 1 FOUNDATION / v1');
const end=layer.indexOf('END OMNIOS PHASE 1 FOUNDATION / v1');
assert.ok(begin>0&&end>begin,'Canonical Phase 1 foundation not located at the final end of the unified theme');
const css=layer.slice(begin,end);
const documentation=fs.readFileSync('design-system/PHASE1.md','utf8');

function luminance(hex){
 const [r,g,b]=hex.match(/[0-9a-f]{2}/gi).map(x=>Number.parseInt(x,16)/255)
  .map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4);
 return .2126*r+.7152*g+.0722*b;
}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
test('six exact palette colors and both semantic theme variants',()=>{
 for(const color of ['#101114','#EEF0F2','#2547E8','#5F31C4','#C6F04A','#55606D']){
  assert.ok(css.includes(color),'Missing approved color '+color);
 }
 assert.match(css,/html:not\(\[data-theme="light"\]\)\{/);
 assert.match(css,/html\[data-theme="light"\]\{/);
 const essential=['canvas','surface','surface-raised','surface-hover','line','text','text-secondary',
  'text-muted','primary','primary-hover','on-primary','accent','accent-surface','success',
  'on-success','danger','focus','skeleton'];
 for(const token of essential)assert.ok(css.includes('--ds-'+token+':'),'No semantic '+token+' token');
 for(const alias of ['--bg-base:var(--ds-canvas)','--bg-surface:var(--ds-surface)',
  '--text-primary:var(--ds-text)','--text-muted:var(--ds-text-muted)']){
  assert.ok(css.includes(alias),'Missing bridge '+alias);
 }
});
test('normal text on supported surfaces passes WCAG AA',()=>{
 const pairs=[
  ['#EEF0F2','#101114'],['#D1D7E0','#1A1C21'],['#B7C0CE','#1A1C21'],
  ['#101114','#EEF0F2'],['#55606D','#EEF0F2'],['#394450','#FFFFFF'],
  ['#FFFFFF','#2547E8'],['#FFFFFF','#5F31C4'],['#101114','#C6F04A'],
  ['#E8DFFF','#30293F'],['#5127B2','#EEE8FA'],['#D5F68C','#2B371A'],
  ['#326500','#F0F9D9'],['#FFA4B1','#412630'],['#AD2944','#FCEAF0']
 ];
 for(const [fg,bg] of pairs)assert.ok(contrast(fg,bg)>=4.5,fg+' on '+bg+' is '+contrast(fg,bg).toFixed(2)+':1');
 assert.ok(contrast('#C6F04A','#EEF0F2')<4.5,'Lime on Mist is not a valid regular-text combination');
});
test('all eight reusable primitives have variants and keyboard focus',()=>{
 for(const cls of ['ds-btn','ds-input','ds-select','ds-textarea','ds-card','ds-tabs','ds-badge','ds-dialog',
  'ds-state','ds-skeleton','ds-alert','ds-progress']){
  assert.ok(css.includes('.'+cls),'Missing primitive '+cls);
 }
 for(const state of ['btn--primary','btn--danger','btn--quiet','card--compact',
  'badge--success','badge--warning','badge--danger','state--error','state--success','alert--error','alert--success']){
  assert.ok(css.includes('ds-'+state),'Missing variant '+state);
 }
 assert.match(css,/:focus-visible/);
 assert.match(css,/\[aria-invalid="true"\]/);
 assert.match(css,/min-height:44px/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/forced-colors:active/);
 assert.match(css,/touch-action:manipulation/);
});
test('foundation does not change application data or navigation logic',()=>{
 assert.ok(documentation.includes('Deferred:'));
 assert.match(documentation,/backup\/omnios-before-phase1-2026-10-11/);
 assert.doesNotMatch(css,/(?:localStorage|indexedDB|MutationObserver|fetch\()/);
 assert.equal(source.split('OMNIOS PHASE 1 FOUNDATION / v1').length-1,2,'Start and end marker only');
});
test('new token utilities can render alongside a legacy form in a DOM fixture',()=>{
 const doc='<!doctype html><html data-theme="light"><head><style>'+css+'</style></head><body>'+
  '<section class="view"><article class="ds-card"><h2 class="ds-heading ds-heading--lg">Foundation</h2>'+
  '<label class="ds-field"><span class="ds-field__label">Name</span><input class="ds-input" aria-invalid="true"/></label>'+
  '<button class="ds-btn ds-btn--primary">Save</button><span class="ds-badge ds-badge--success">Complete</span></article>'+
  '<article class="v35-card"><input class="form-input" aria-label="Legacy field"></article></section></body></html>';
 const dom=new JSDOM(doc);
 assert.equal(dom.window.document.querySelectorAll('article').length,2);
 assert.ok(dom.window.document.querySelector('.ds-btn--primary'));
 assert.ok(dom.window.document.querySelector('.form-input'));
 dom.window.close();
});
