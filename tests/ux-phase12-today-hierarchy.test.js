import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync('js/omnios-today-phase03.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase03.css','utf8');
test('Phase 12 moves original attention DOM after actual Today metric snapshot',()=>{
 assert.match(js,/host\.querySelector\('\.om3-daily-glance'\)/);
 assert.match(js,/host\.querySelector\('#v58-attention'\)/);
 assert.match(js,/glance\.nextElementSibling!==attention/);
 assert.match(js,/glance\.after\(attention\)/);
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|\.innerHTML\s*=/);
 assert.doesNotThrow(()=>new vm.Script(js));
});
test('Phase 12 keeps all four existing shortcuts but makes navigation semantic',()=>{
 assert.match(js,/el\('nav','ux03-command-actions'\)/);
 assert.match(js,/actions\.setAttribute\('aria-label','Today shortcuts'\)/);
 for(const [label,view] of [['Tasks','tasks'],['Calendar','master-calendar'],['Inbox','inbox'],['Insights','dashboard']])
   assert.ok(js.includes("button('"+label+"','"+view+"')"),label);
 assert.match(js,/state\.expanded=!state\.expanded/);
});
test('Phase 12 Today stylesheet directly styles renderer classes, retains connected insights and all actions',()=>{
 for(const selector of ['.omr-day-hero.om3-today-hero','.om3-daily-glance .omr-stat','#v58-attention','.om3-today-grid','#ux03-today-controls','.om3-capture-panel'])
   assert.ok(css.includes(selector),selector);
 assert.match(css,/#view-today\.ux03-focus-mode #v58-today-intelligence\{display:none!important\}/);
 assert.match(css,/@media\(max-width:760px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 // These are the two deliberate exceptions: connected insights are hidden
 // when collapsed, and the universal mobile dock replaces duplicate '+ New'.
 assert.match(css,/#v35-today-add\{display:none!important\}/);
 // Phase 12 guarantees that the original page controls are not removed.
 // Phase 18 deliberately adds *reversible* hidden secondary sections; test
 // that independent contract separately rather than rejecting all disclosure.
 const legacy=css.split('/* Phase 18 — progressive disclosure')[0];
 const active=legacy
   .replace(/#view-today\.ux03-focus-mode #v58-today-intelligence\{display:none!important\}/,'')
   .replace(/#v35-today-add\{display:none!important\}/,'');
 assert.doesNotMatch(active,/visibility:\s*hidden|pointer-events:\s*none|display:\s*none/);
 const disclosure=css.split('/* Phase 18 — progressive disclosure')[1];
 assert.ok(disclosure,'Phase 18 has an explicit, scoped disclosure rule');
 assert.match(disclosure,/#view-today,#view-dashboard,#view-inbox/);
 assert.match(disclosure,/\.ux18-collapsed-section/);
 assert.match(js,/sectionsExpanded/);
 assert.match(js,/dashboardExpanded/);
 assert.match(js,/inboxExpanded/);
});
