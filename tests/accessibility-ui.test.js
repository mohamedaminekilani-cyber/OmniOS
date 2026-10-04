import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const p1=fs.readFileSync('app-parts/part-001.html','utf8');
const p2=fs.readFileSync('app-parts/part-002.html','utf8');
const p4=fs.readFileSync('app-parts/part-004.html','utf8');
const p5=fs.readFileSync('app-parts/part-005.html','utf8');
const p28=fs.readFileSync('app-parts/part-028.html','utf8');

test('final accessibility authority uses readable muted colors and mobile text floor',()=>{
  assert.match(p28,/--text-muted:#a7afbc!important/);
  assert.match(p28,/--text-muted:#596474!important/);
  assert.match(p28,/\.mobile-nav button \.nav-label\{font-size:11px!important/);
  assert.match(p28,/@media\(prefers-contrast:more\)/);
  assert.match(p28,/@media\(forced-colors:active\)/);
});

test('coarse pointers use 44px controls and unified dialog has focus/safe-area behavior',()=>{
  assert.match(p28,/@media\(pointer:coarse\)\{:root\{--ux-touch:44px\}\}/);
  assert.match(p28,/window\.OmniDialog=\{confirm:/);
  assert.match(p28,/aria-modal="true"/);
  assert.match(p28,/document\.body\.style\.overflow='hidden'/);
  assert.match(p28,/e\.key==='Escape'/);
  assert.match(p28,/env\(safe-area-inset-bottom\)/);
});

test('common reversible deletes use undo instead of native confirm',()=>{
  assert.doesNotMatch(p1,/function deleteTask\(id\) \{\s*if \(!confirm/);
  assert.doesNotMatch(p2,/edit-txn-delete-btn[^]{0,250}confirm\(/);
  assert.doesNotMatch(p5,/v38-ft-delete[^]{0,220}confirm\(/);
  assert.match(p5,/v38-ft-delete[^]{0,260}toastUndo/);
  assert.doesNotMatch(p28,/pf-delete[^]{0,300}confirm\(/);
});

test('high-impact irreversible actions use themed dialog instead of native dialogs',()=>{
  assert.match(p2,/focusStopGuard\(\)[^]{0,320}OmniDialog\.confirm/);
  assert.match(p4,/restoreSnapshot35\(id\)[^]{0,500}OmniDialog\.confirm/);
  assert.match(p4,/Restore this backup\?[^]{0,220}confirmLabel:'Restore'/);
  assert.match(p4,/OmniDialog\.alert\('Could not import backup:/);
});

test('mobile page launcher labels remain visible above legacy icon layers',()=>{
  assert.match(p28,/omnios-v104-mobile-page-labels/);
  assert.match(p28,/#v35-page-launcher \[data-v35-more\] > \.v35-launcher-label\{/);
  assert.match(p28,/display:block!important/);
  assert.match(p28,/visibility:visible!important/);
  assert.match(p28,/color:var\(--text-primary\)!important/);
  assert.match(p28,/font-size:11px!important/);
});
