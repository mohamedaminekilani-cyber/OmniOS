import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

test('Life Hub has one visual authority: v43',()=>{
  const legacy=fs.readFileSync('app-parts/part-004.html','utf8');
  const base=fs.readFileSync('app-parts/part-001.html','utf8');
  const current=fs.readFileSync('app-parts/part-006.html','utf8');

  assert.match(legacy,/function renderLife35\(\)\{const recent=window\.__secondBrainRenderLifeHub/);
  assert.equal(legacy.includes('.v35-life-toolbar'),false);
  assert.equal(base.includes('#view-life-hub .v35-record-card'),false);
  assert.equal(base.includes('#view-life-hub .v35-life-sectionbar'),false);

  const start=current.indexOf('function renderAdmin43');
  const end=current.indexOf('function renderLife43');
  assert.ok(start>=0&&end>start,'current Life Hub renderer block must exist');
  const active=current.slice(start,end);
  assert.doesNotMatch(active,/class="v35-(?:record|admin|auto|life)/);
  assert.equal(active.includes('renderAutomations35(host)'),false);
  assert.match(current,/window\.__secondBrainRenderLifeHub=renderLife43/);
  assert.match(active,/class="v43-record-actions"/);
});
