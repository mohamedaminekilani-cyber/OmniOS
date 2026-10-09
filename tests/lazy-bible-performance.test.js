import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';
import {sourceRelease} from '../scripts/release-source.mjs';

test('full NIV corpus is lazy and checksum-pinned',()=>{
  const data=fs.readFileSync('data/niv-bible.json','utf8');
  assert.equal(createHash('sha256').update(data).digest('hex'),'59d940003de9b30ef2223df7b45d6e315dedce60960e3af1cfcbd92923548d41');
  const parsed=JSON.parse(data);assert.equal(parsed.books.length,66);assert.equal(parsed.stats.chapters,1189);assert.equal(parsed.stats.verses,31086);
  const p26=fs.readFileSync('app-parts/part-026.html','utf8');
  assert.match(p26,/NIV_DATA_URL='\.\/data\/niv-bible\.json'/);
  assert.match(p26,/async function ensureNivData\(\)/);
  assert.match(p26,/Bible checksum mismatch/);
  assert.match(p26,/omnios-bible-data-v1/);
  assert.match(p26,/const DAILY_VERSE_TEXT79=/);
});

test('source release skips empty Bible carrier fragments and stays below 4 MB',()=>{
  const {html,manifest}=sourceRelease();
  assert.ok(manifest.parts.length<=13,`expected at most 13 non-empty source parts, got ${manifest.parts.length}`);
  assert.ok(Buffer.byteLength(html)<4_000_000,`startup payload too large: ${Buffer.byteLength(html)}`);
  for(let i=10;i<=24;i++)assert.equal(manifest.parts.includes(`app-parts/part-${String(i).padStart(3,'0')}.html`),false);
});
