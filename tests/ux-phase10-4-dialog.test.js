import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const js=fs.readFileSync('js/omnios-modules-phase07.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-foundation.css','utf8');
test('Phase 10.4 opt-in dialog is asynchronous and does not override native dialogs',()=>{
 assert.match(js,/function uxDialog\(/);
 assert.match(js,/return new Promise\(resolve=>\{/);
 assert.match(js,/dialog:uxDialog/);
 assert.match(js,/aria-modal','true'/);
 assert.match(js,/aria-labelledby/);
 assert.match(js,/aria-describedby/);
 assert.match(js,/e\.key==='Escape'/);
 assert.match(js,/e\.key==='Tab'/);
 assert.match(js,/previous\.focus\(\)/);
 assert.doesNotMatch(js,/window\.(?:alert|confirm|prompt)\s*=/);
 assert.doesNotMatch(js,/localStorage|indexedDB|saveState/);
 assert.doesNotThrow(()=>new vm.Script(js));
});
test('Phase 10.4 dialog supports cancel, explicit confirmation and editable text',()=>{
 for(const item of ['cancel.addEventListener','confirm.addEventListener','field.value','uxDialogOpen=false'])assert.ok(js.includes(item),item);
 assert.match(css,/\.ux-dialog-overlay/);
 assert.match(css,/\.ux-dialog-panel/);
 assert.match(css,/\.ux-dialog-actions/);
 assert.match(css,/@media\(max-width:760px\)/);
});
