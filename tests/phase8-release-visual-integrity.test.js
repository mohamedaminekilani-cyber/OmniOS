import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import {sourceRelease} from '../scripts/release-source.mjs';

test('committed release matches exact assembled source without rewriting files',()=>{
 const original=fs.readFileSync('source-release.json','utf8');
 const expected=JSON.parse(original);
 const actual=sourceRelease().manifest;
 assert.deepEqual(expected,actual);
 const proc=spawnSync(process.execPath,['scripts/release-source.mjs','--check'],{encoding:'utf8'});
 assert.equal(proc.status,0,proc.stderr);
 assert.equal(fs.readFileSync('source-release.json','utf8'),original);
});

test('CI pipelines never silently generate a replacement manifest',()=>{
 const pages=fs.readFileSync('.github/workflows/pages.yml','utf8');
 const qa=fs.readFileSync('.github/workflows/phase7-qa.yml','utf8');
 assert.match(pages,/node scripts\/release-source\.mjs --check/);
 assert.match(qa,/run: npm test && npm run test:runtime/);
 assert.doesNotMatch(pages,/run: npm run release:source/);
 assert.doesNotMatch(qa,/run: npm run release:source/);
});

test('Chrome screenshots represent module content instead of recurring welcome overlay',()=>{
 const qa=fs.readFileSync('scripts/phase7-browser-qa.mjs','utf8');
 for(const term of ['#welcome63','[data-w63close]','Welcome screen dismissed through real UI action',
 'has no blocking welcome overlay','screenshotSignatures','createHash','snapshots differ across real modules',
 'No uncaught browser runtime exceptions']){
  assert.ok(qa.includes(term),'Missing visual integrity guard: '+term);
 }
});
