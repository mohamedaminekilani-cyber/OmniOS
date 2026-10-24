import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const css=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
const js=fs.readFileSync('js/omnios-modules-phase07.js','utf8');
const part=css.slice(css.indexOf('/* Phase 10.5–10.7:'));
test('Phase 10.5 provides responsive layout, accessible hints and shared form primitives',()=>{
 for(const c of ['.ux-stack','.ux-cluster','.ux-grid','.ux-form-row','.ux-textarea','.ux-select','.ux-field-hint','.ux-sr-only'])assert.ok(part.includes(c),c);
 for(const t of ['--ux-space-4','--ux-control-height','--ux-radius-sm','--ux-border','--ux-text-base'])assert.ok(part.includes('var('+t+')'),t);
 assert.match(part,/@media\(max-width:760px\)/);
 assert.doesNotMatch(part,/!important|display:none|pointer-events:none/);
});
test('Phase 10.6 accessibility and dialogs preserve native calls and one completion',()=>{
 assert.match(js,/let settled=false;/);
 assert.match(js,/if\(settled\)return;/);
 assert.match(js,/e\.stopPropagation\(\);finish\(null\)/);
 assert.match(js,/role','dialog'/);
 assert.match(js,/aria-modal','true'/);
 assert.match(js,/aria-invalid/);
 assert.doesNotMatch(js,/window\.(?:prompt|confirm|alert)\s*=/);
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState|\.innerHTML\s*=/);
 assert.doesNotThrow(()=>new vm.Script(js));
});
