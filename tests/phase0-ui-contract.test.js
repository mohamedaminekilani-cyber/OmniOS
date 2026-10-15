import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {collectUiInventory} from '../scripts/phase0-ui-inventory.mjs';
import {sourceRelease} from '../scripts/release-source.mjs';

const snapshot=collectUiInventory();

test('Phase 0 inventory covers the assembled app, startup page and canonical views',()=>{
 assert.ok(snapshot.totals.sourceFiles>=14);
 assert.ok(snapshot.totals.styleBlocks>=100);
 assert.ok(snapshot.navigation.sidebarRoutes.length>=25);
 for(const route of ['today','dashboard','tasks','master-calendar','habits','workout','notes','settings']){
  assert.ok(snapshot.navigation.sidebarRoutes.includes(route),'missing '+route);
 }
 assert.deepEqual([...new Set(snapshot.navigation.sidebarRoutes)],snapshot.navigation.sidebarRoutes,'duplicate sidebar destinations');
 assert.ok(snapshot.navigation.mobilePrimaryRoutes.length>=4);
 assert.ok(snapshot.navigation.hasMobileMore,'mobile More destination was lost');
 assert.deepEqual(snapshot.duplicateStyleIds,[],'duplicate named style blocks');
});

test('Phase 0 assembled release remains verified and source-owned',()=>{
 const saved=JSON.parse(fs.readFileSync('source-release.json','utf8'));
 const built=sourceRelease().manifest;
 assert.equal(built.sha256,saved.sha256);
 assert.equal(built.bytes,saved.bytes);
 assert.deepEqual(built.parts,saved.parts);
 assert.deepEqual(built.modules,saved.modules);
});

test('Phase 0 transitional styling budgets cannot regress before consolidation',()=>{
 // Measured baseline: ~7,174 !important declarations and 41 observer occurrences.
 // These are transitional ceilings, not quality targets; Phase 1 must reduce them.
 assert.ok(snapshot.totals.important<=7500,
  'excessive additional !important declarations: '+snapshot.totals.important);
 assert.ok(snapshot.totals.mutationObserverOccurrences<=45,
  'additional MutationObserver sources require a lifecycle review: '+snapshot.totals.mutationObserverOccurrences);
});

test('Phase 0 never removes the encrypted-data and note-save contracts',()=>{
 const shell=fs.readFileSync('app-parts/part-001.html','utf8');
 const runtime=fs.readFileSync('scripts/runtime-check.mjs','utf8');
 assert.match(shell,/function saveState\(\)/);
 assert.match(shell,/omnios_v3_state/);
 for(const marker of ['Vault migration','Note ID lookup','Navigation passed for']){
   assert.ok(runtime.includes(marker),'runtime contract missing '+marker);
 }
 const workout=fs.readFileSync('js/home-workout.js','utf8');
 assert.doesNotMatch(workout,/<img|@bryllim|cdn\.jsdelivr/);
});
