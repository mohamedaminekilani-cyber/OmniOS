import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';

test('Dashboard has one visual authority: v431',()=>{
  const legacy=fs.readFileSync('app-parts/part-002.html','utf8');
  const current=fs.readFileSync('app-parts/part-006.html','utf8');
  const studio=fs.readFileSync('app-parts/part-007.html','utf8');
  const routine=fs.readFileSync('app-parts/part-028.html','utf8');

  assert.match(legacy,/function renderDashboard\(\)\{const recent=window\.__secondBrainRenderDashboard/);
  assert.match(current,/window\.__secondBrainRenderDashboard=renderDashboard43/);
  assert.match(current,/sec\.classList\.add\('v431-dashboard'\)/);
  assert.match(studio,/function enhanceDashboard55\(\)\{document\.getElementById\('v55-dashboard-widgets'\)\?\.remove\(\)\}/);
  assert.match(routine,/function renderDashboardRoutine611\(\)\{document\.getElementById\('routine-dashboard-v611'\)\?\.remove\(\)/);
});
