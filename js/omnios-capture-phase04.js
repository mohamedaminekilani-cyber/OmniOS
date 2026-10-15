/* OmniOS Phase 04 — one capture doorway, existing save paths only. */
(function(){
'use strict';
if(window.OmniCapture04)return;
const TYPES=[
 ['task','Task'],['event','Event'],['note','Note'],['habit','Habit'],
 ['expense','Expense'],['income','Income'],['project','Project'],
 ['goal','Goal'],['journal','Journal']
];
const LEGACY_TYPE=/^(?:task|event|meeting|note|habit|expense|income|project|goal|journal)\b\s*/i;
const $=s=>document.querySelector(s);
function enhance(){
 const input=$('#v55-capture-text');
 if(!input)return false;
 const ov=input.closest('.modal-overlay'),modal=input.closest('.modal');
 if(!ov||!modal||modal.querySelector('#ux04-capture-tools'))return !!modal;
 modal.classList.add('ux04-capture-modal');
 modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');
 const heading=modal.querySelector('.modal-title');
 if(heading){heading.id='ux04-capture-title';modal.setAttribute('aria-labelledby',heading.id);heading.textContent='Quick Capture'}
 const section=document.createElement('section');
 section.id='ux04-capture-tools';section.setAttribute('aria-label','Capture entry type');
 const top=document.createElement('div');top.className='ux04-capture-heading';
 const intro=document.createElement('strong');intro.textContent='What would you like to capture?';
 const explanation=document.createElement('span');explanation.textContent='Write naturally, or select a type. Review the preview before saving.';
 top.append(intro,explanation);
 const row=document.createElement('div');row.className='ux04-chip-row';row.setAttribute('role','group');row.setAttribute('aria-label','Capture types');
 for(const [type,label] of TYPES){
   const b=document.createElement('button');b.type='button';b.className='ux04-type-chip';
   b.dataset.ux04Type=type;b.textContent=label;
   b.addEventListener('click',()=>{
     const original=input.value.trim();
     const seed=original.replace(LEGACY_TYPE,'').trim();
     input.value=type+' '+seed;
     input.dispatchEvent(new Event('input',{bubbles:true}));
     input.focus();
     input.setSelectionRange(input.value.length,input.value.length);
     updateSelected();
   });
   row.appendChild(b);
 }
 const footer=document.createElement('div');footer.className='ux04-more-row';
 const more=document.createElement('button');more.type='button';
 more.id='ux04-all-types';more.className='ux04-all-types';more.textContent='Browse all creation types ↗';
 more.addEventListener('click',()=>{
   ov.querySelector('[data-v55-close]')?.click();
   if(typeof window.openModal==='function')window.openModal('quick-add-modal');
   const old=$('#quick-add-modal');
   old?.querySelector('.modal-title')?.focus?.();
 });
 footer.appendChild(more);
 section.append(top,row,footer);
 input.closest('.form-group')?.before(section);
 const updateSelected=()=>{
   const type=input.value.trim().match(LEGACY_TYPE)?.[0]?.trim().toLowerCase();
   row.querySelectorAll('[data-ux04-type]').forEach(b=>{
     const selected=b.dataset.ux04Type===type;
     b.classList.toggle('active',selected);
     b.setAttribute('aria-pressed',String(selected));
   });
 };
 input.addEventListener('input',updateSelected);
 updateSelected();
 return true;
}
function open(seed=''){
 if(typeof window.OmniV55?.capture==='function'){
   window.OmniV55.capture(String(seed||''));enhance();return true;
 }
 if(typeof window.openModal==='function'){
   window.openModal('quick-add-modal');return true;
 }
 return false;
}
function install(){
 // Delegation in capture phase prevents older direct click handlers from opening
 // competing dialogs. Context-specific module buttons are deliberately untouched.
 document.addEventListener('click',e=>{
   const btn=e.target.closest?.('#global-add-btn,#v35-today-add,#v55-capture-fab,#ux02-mobile-nav [data-ux02-capture]');
   if(!btn)return;
   if(!window.OmniV55?.capture)return; // preserve legacy fallback until V55 is initialized
   e.preventDefault();e.stopImmediatePropagation();open();
 },true);
 // Old v55 shortcut and other modules may open the same dialog directly.
 // Observe only top-level modal insertion; never watch the application subtree.
 new MutationObserver(mutations=>{
   if(mutations.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&n.querySelector?.('#v55-capture-text')))){
     queueMicrotask(enhance);
   }
 }).observe(document.body,{childList:true});
 enhance();
}
window.OmniCapture04={open,enhance,types:TYPES.map(([id])=>id)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
