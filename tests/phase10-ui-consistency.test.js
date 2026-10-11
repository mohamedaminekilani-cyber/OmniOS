import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync('app-parts/part-028.html','utf8');
const css=html.match(/<style id="omnios-unified-design-2026">([\s\S]*?)<\/style>/)?.[1]||'';
const phase10=css.slice(css.indexOf('OMNIOS PHASE 10 / APP-WIDE VISUAL CONSISTENCY / v1'));

test('Phase 10 stylesheet is contained in reversible modern mode',()=>{
 assert.ok(phase10.startsWith('OMNIOS PHASE 10 / APP-WIDE VISUAL CONSISTENCY / v1'));
 assert.ok(phase10.includes('END OMNIOS PHASE 10 / APP-WIDE VISUAL CONSISTENCY / v1'));
 assert.ok(html.includes("css.disabled=mode==='classic'"));
 assert.doesNotMatch(phase10,/MutationObserver|localStorage|fetch\(|setInterval/);
});
test('Settings switches retain a compact 50 by 30 hit area and a centered thumb',()=>{
 for(const s of ['width:50px!important','height:30px!important','min-height:30px!important',
                 'top:4px!important;left:4px!important','left:24px!important',
                 ':focus-visible'])assert.ok(phase10.includes(s),'Missing '+s);
 assert.ok(phase10.includes('.settings-toggle:is(.on,[aria-checked="true"])'));
});
test('All major dynamic page headings share padding and semantic type hierarchy',()=>{
 for(const s of ['.v35-page-head','.omx-page-heading','.org-hero','.v38-finance-head',
                 '.diet-hero','.v55-studio-head','.finance-hero'])
  assert.ok(phase10.includes(s),'Unstyled '+s);
 assert.ok(phase10.includes('padding:20px 22px!important'));
 assert.ok(phase10.includes('padding:16px!important'));
 assert.ok(phase10.includes('overflow:visible!important'));
});
test('Page-cover affordance stays available but compact',()=>{
 assert.ok(phase10.includes('.v44-page-cover-shell:has(.v44-page-cover-empty)'));
 assert.ok(phase10.includes('min-height:28px!important'));
});
test('Finance controls fit into a bounded single-row picker',()=>{
 for(const id of ['v38-prev-month','v38-today-month','v38-next-month'])
  assert.ok(phase10.includes('#'+id));
 assert.ok(phase10.includes('grid-template-columns:38px auto minmax(115px,1fr) 38px!important'));
});
test('Dashboard life rows, metrics and progress bars all use shared surfaces',()=>{
 for(const s of ['.v43-mini-grid','.v431-detail-grid','.v43-metric','.v431-detail',
                 '.v431-area-row','.v431-area-head','.v431-area-meta','.v43-progress'])
  assert.ok(phase10.includes(s),'Missing '+s);
 assert.ok(phase10.includes('background:var(--om10-subtle)!important'));
});
test('Planner drop zones are preserved but reduced to practical heights',()=>{
 assert.ok(phase10.includes('min-height:176px!important'));
 assert.ok(phase10.includes('min-height:94px!important'));
 assert.ok(phase10.includes('.v35-week-grid'));
});
test('Profile save has an inline footer and no giant modal-height spacer',()=>{
 assert.ok(phase10.includes('.modal-footer:has(#profile-save)'));
 assert.ok(phase10.includes('height:auto!important'));
 assert.ok(phase10.includes('max-height:none!important'));
 assert.ok(phase10.includes('border-top:1px solid var(--om10-border)!important'));
});
test('Welcome honors same flat surfaces and mobile-safe height',()=>{
 assert.ok(phase10.includes('#welcome63 .w63-shell'));
 assert.ok(phase10.includes('height:100dvh!important'));
 assert.ok(phase10.includes('max-height:100dvh!important'));
});
