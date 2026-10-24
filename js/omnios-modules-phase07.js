/* OmniOS UX Phase 07 — consistent module controls, preserving original handlers. */
(function(){
'use strict';
if(window.OmniModules07)return;
const MODULES=[
  {id:'workout',tab:'.workout-tabs',button:'[data-workout-tab]',label:'Workout sections'},
  {id:'diet',tab:'.nut-tabs',button:'[data-nut-tab]',label:'Nutrition sections'},
  {id:'habits',tab:'.habit-toolbar .toolbar-group',button:'[data-habitview]',label:'Habit history views'}
];
const state={installed:false,pending:false};
function setAttr(node,name,value){
 if(node&&node.getAttribute(name)!==value)node.setAttribute(name,value);
}
function updateGroup(spec){
  const root=document.getElementById('view-'+spec.id);
  if(!root)return;
  const group=root.querySelector(spec.tab);
  if(!group)return;
  setAttr(group,'role','group');
  setAttr(group,'aria-label',spec.label);
  group.querySelectorAll(spec.button).forEach(b=>{
    const active=b.classList.contains('active');
    setAttr(b,'aria-pressed',String(active));
    if(!b.getAttribute('aria-label'))setAttr(b,'aria-label',b.textContent.trim());
  });
}
function decorate(){
 state.pending=false;
 MODULES.forEach(updateGroup);
 const workout=document.getElementById('view-workout');
 const start=workout?.querySelector('#workout-start-btn');
 setAttr(start,'aria-label','Start a workout session');
 const finance=document.getElementById('view-budget');
 const month=finance?.querySelector('.v38-month-nav,.finance-period-nav');
 if(month){setAttr(month,'role','group');setAttr(month,'aria-label','Finance month navigation');}
 const finTabs=finance?.querySelector('.v38-fin-tabs');
 if(finTabs){setAttr(finTabs,'role','group');setAttr(finTabs,'aria-label','Finance sections');}
 const notes=document.getElementById('view-notes');
 const toolbar=notes?.querySelector('.org-toolbar,.notes-toolbar');
 setAttr(toolbar,'role','search');
 const search=notes?.querySelector('#org-note-search,#notes-search');
 setAttr(search,'aria-label','Search notes');
 // Notes V40 uses .org-seg (not .org-segmented). Keep the original layout handlers.
 const views=notes?.querySelector('.org-toolbar .org-seg');
 if(views){
   setAttr(views,'role','group');
   setAttr(views,'aria-label','Notes layout');
   views.querySelectorAll('[data-org-view]').forEach(button=>{
     setAttr(button,'aria-pressed',String(button.classList.contains('active')));
   });
 }
 const collections=notes?.querySelector('.org-rail');
 if(collections){
   setAttr(collections,'aria-label','Note collections');
   collections.querySelectorAll('[data-note-scope]').forEach(button=>{
     setAttr(button,'aria-pressed',String(button.classList.contains('active')));
   });
 }
}
// Opt-in inline feedback for forms migrated to the shared UX contract.
// No automatic validation or save interception: legacy flows remain authoritative.
const fieldMessages=new WeakMap();
let nextMessageId=0;
function clearFieldError(field){
 if(!field)return;
 const record=fieldMessages.get(field);
 if(!record)return;
 if(record.hadInvalid)field.setAttribute('aria-invalid',record.invalid);
 else field.removeAttribute('aria-invalid');
 if(record.hadDescribedBy)field.setAttribute('aria-describedby',record.describedBy);
 else field.removeAttribute('aria-describedby');
 if(record.message.parentNode)record.message.parentNode.removeChild(record.message);
 fieldMessages.delete(field);
}
function reportFieldError(field,message){
 if(!field||typeof field.setAttribute!=='function')return false;
 const text=String(message||'').trim();
 if(!text){clearFieldError(field);return false}
 let record=fieldMessages.get(field);
 if(!record){
  const node=document.createElement('p');
  node.id='ux07-field-feedback-'+(++nextMessageId);
  node.className='ux-field-feedback ux-field-feedback-error';
  node.setAttribute('role','alert');
  const describedBy=field.getAttribute('aria-describedby');
  record={message:node,hadInvalid:field.hasAttribute('aria-invalid'),
   invalid:field.getAttribute('aria-invalid'),hadDescribedBy:field.hasAttribute('aria-describedby'),
   describedBy};
  fieldMessages.set(field,record);
  field.insertAdjacentElement('afterend',node);
  field.setAttribute('aria-describedby',[describedBy,node.id].filter(Boolean).join(' '));
 }
 record.message.textContent=text;
 field.setAttribute('aria-invalid','true');
 return true;
}
// Phase 10.4 — opt-in asynchronous dialogs. Native confirm/prompt flows remain
// untouched until individual call sites are migrated and validated.
let uxDialogOpen=false;
function uxDialog({title='Confirm action',message='',label='Value',defaultValue='',confirmLabel='Continue',danger=false,input=false}={}){
 if(uxDialogOpen)return Promise.resolve(null);
 uxDialogOpen=true;
 return new Promise(resolve=>{
  const previous=document.activeElement;
  const overlay=document.createElement('div');
  overlay.className='ux-dialog-overlay';
  const panel=document.createElement('section');
  panel.className='ux-dialog-panel';
  panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');
  const heading=document.createElement('h2');
  heading.className='ux-dialog-heading';
  heading.id='ux-dialog-heading';
  heading.textContent=String(title);
  panel.setAttribute('aria-labelledby',heading.id);
  const description=document.createElement('p');
  description.className='ux-dialog-description';
  description.id='ux-dialog-description';
  description.textContent=String(message);
  panel.setAttribute('aria-describedby',description.id);
  panel.append(heading,description);
  let field=null;
  if(input){
   const caption=document.createElement('label');
   caption.className='ux-field-label';
   caption.textContent=String(label);
   field=document.createElement('input');
   field.className='ux-input';
   field.type='text';
   field.value=String(defaultValue);
   field.id='ux-dialog-input';
   caption.htmlFor=field.id;
   panel.append(caption,field);
  }
  const actions=document.createElement('div');
  actions.className='ux-dialog-actions';
  const cancel=document.createElement('button');
  cancel.type='button';cancel.className='ux-button ux-button-secondary';cancel.textContent='Cancel';
  const confirm=document.createElement('button');
  confirm.type='button';confirm.className='ux-button '+(danger?'ux-button-danger':'ux-button-primary');
  confirm.textContent=String(confirmLabel);
  actions.append(cancel,confirm);panel.append(actions);overlay.append(panel);
  function finish(value){
   overlay.removeEventListener('keydown',onKey);
   if(overlay.parentNode)overlay.parentNode.removeChild(overlay);
   uxDialogOpen=false;
   if(previous?.isConnected&&typeof previous.focus==='function'){
    previous.focus();
    // Legacy document-level modal handlers may restore another focus target
    // later in the same Escape event. Reassert after propagation finishes.
    queueMicrotask(()=>{if(!uxDialogOpen&&previous.isConnected)previous.focus()});
    requestAnimationFrame(()=>{
     if(!uxDialogOpen&&previous.isConnected)previous.focus();
    });
   }
   resolve(value);
  }
  function onKey(e){
   if(e.key==='Escape'){e.preventDefault();finish(null);return}
   if(e.key==='Tab'){
    const nodes=field?[field,cancel,confirm]:[cancel,confirm];
    const i=nodes.indexOf(document.activeElement);
    if(e.shiftKey&&i<=0){e.preventDefault();confirm.focus()}
    else if(!e.shiftKey&&i===nodes.length-1){e.preventDefault();nodes[0].focus()}
   }
   if(e.key==='Enter'&&field&&document.activeElement===field){e.preventDefault();finish(field.value)}
  }
  overlay.addEventListener('keydown',onKey);
  cancel.addEventListener('click',()=>finish(null));
  confirm.addEventListener('click',()=>finish(field?field.value:true));
  overlay.addEventListener('click',e=>{if(e.target===overlay)finish(null)});
  document.body.appendChild(overlay);
  (field||cancel).focus();
 });
}
function refresh(){
 if(state.pending)return;
 state.pending=true;queueMicrotask(decorate);
}
function install(){
 if(state.installed)return;
 state.installed=true;
 // Nutrition replaces its own root children; observe only that root, never all descendants.
 const observer=new MutationObserver(refresh);
 const diet=document.getElementById('view-diet');
 if(diet)observer.observe(diet,{childList:true});
 // One observer covers three direct-child containers; no subtree observation.
 for(const id of ['budget','notes']){
   const root=document.getElementById('view-'+id);
   if(root)observer.observe(root,{childList:true});
 }
 document.addEventListener('click',e=>{
   if(e.target.closest?.('[data-view],[data-ux02-view],[data-habitview],[data-workout-tab],[data-nut-tab],[data-org-view],[data-note-scope],[data-v38-tab]'))requestAnimationFrame(refresh);
 },false);
 window.addEventListener('hashchange',refresh);
 refresh();
}
window.OmniModules07={refresh,reportFieldError,clearFieldError,dialog:uxDialog,views:MODULES.map(m=>m.id).concat(['budget','notes'])};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
else install();
})();
