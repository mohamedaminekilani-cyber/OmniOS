import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';

const js=fs.readFileSync('js/omnios-navigation-phase02.js','utf8');
const css=fs.readFileSync('styles/omnios-ux-phase02.css','utf8');

function fixture(){
  const ids=['today','dashboard','inbox','planner','master-calendar','tasks','projects','routine',
    'habits','goals','reminders','focus','automations','life-hub','workout','diet','budget',
    'grocery','pantry','wishlist','notes','bible','templates','relations','activity',
    'studio','data-center','passwords','settings','help'];
  const nav=ids.map((id,i)=>'<button type="button" class="nav-item'+(i===0?' active':'')+'" data-view="'+id+'">'+id+'</button>').join('');
  const screens=ids.map((id,i)=>'<section id="view-'+id+'" class="view'+(i===0?' active':'')+'"></section>').join('');
  const dom=new JSDOM('<!doctype html><html><body><aside class="sidebar"><nav class="nav-menu">'+nav+'</nav></aside><nav class="mobile-nav"></nav><button id="global-add-btn"></button><span id="view-title"></span>'+screens+'</body></html>',
    {runScripts:'outside-only',pretendToBeVisual:true,url:'https://omnios.test/'});
  const {window:w}=dom;
  const destinations=[];
  w.switchView=id=>{
    destinations.push(id);
    w.document.querySelectorAll('.view').forEach(node=>node.classList.toggle('active',node.id==='view-'+id));
    w.document.querySelectorAll('.nav-item[data-view]').forEach(node=>node.classList.toggle('active',node.dataset.view===id));
  };
  w.eval(js);
  w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
  return {w,doc:w.document,ids,destinations,close:()=>w.close()};
}

test('Phase 15 preserves every original navigation button and route',async()=>{
  const x=fixture();try{
    const originals=x.ids.map(id=>x.doc.querySelector('.sidebar .nav-item[data-view="'+id+'"]'));
    assert.equal(x.doc.querySelectorAll('.sidebar .nav-item[data-view]').length,x.ids.length);
    assert.ok(originals.every(Boolean));
    assert.equal(x.doc.querySelectorAll('.ux02-side-group').length,4);
    assert.equal(x.doc.querySelectorAll('.ux15-shortcut').length,4);
    assert.deepEqual([...x.doc.querySelectorAll('.ux15-shortcut')].map(b=>b.dataset.ux15View),
      ['today','tasks','master-calendar','notes']);
    const tasks=x.doc.querySelector('[data-ux15-view="tasks"]');
    tasks.click();
    await Promise.resolve();
    assert.equal(x.destinations.at(-1),'tasks');
    assert.equal(x.doc.getElementById('view-tasks').classList.contains('active'),true);
    assert.equal(tasks.getAttribute('aria-current'),'page');
    assert.equal(x.doc.querySelector('.sidebar .nav-item[data-view="tasks"]'),originals[x.ids.indexOf('tasks')]);
  }finally{x.close()}
});

test('Phase 15 page filter expands matching groups and restores all links',()=>{
  const x=fixture();try{
    const input=x.doc.getElementById('ux15-nav-search');
    assert.equal(input.type,'search');
    input.value='bible';input.dispatchEvent(new x.w.Event('input',{bubbles:true}));
    const visible=[...x.doc.querySelectorAll('.sidebar .nav-item[data-view]:not([hidden])')];
    assert.deepEqual(visible.map(b=>b.dataset.view),['bible']);
    assert.equal(x.doc.querySelector('.ux02-side-group[data-ux02-group="today"]').hidden,true);
    assert.equal(x.doc.querySelector('.ux02-side-group[data-ux02-group="library"]').hidden,false);
    assert.equal(x.doc.getElementById('ux15-search-status').textContent,'1 matching page');
    input.value='not-a-real-route';input.dispatchEvent(new x.w.Event('input',{bubbles:true}));
    assert.equal(x.doc.getElementById('ux15-search-status').textContent,'No pages found');
    input.dispatchEvent(new x.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
    assert.equal(input.value,'');
    assert.equal(x.doc.querySelectorAll('.sidebar .nav-item[data-view]:not([hidden])').length,x.ids.length);
    assert.equal(x.doc.querySelector('[data-ux02-toggle="today"]').getAttribute('aria-expanded'),'true');
  }finally{x.close()}
});

test('Phase 15 mobile drawer can search without replacing destination handlers',()=>{
  const x=fixture();try{
    const tab=x.doc.querySelector('#ux02-mobile-nav [data-ux02-group="library"]');
    tab.click();
    const drawer=x.doc.getElementById('ux02-nav-drawer');
    assert.equal(drawer.hidden,false);
    const search=drawer.querySelector('.ux15-drawer-search');
    assert.equal(search.getAttribute('aria-label'),'Search pages in this section');
    search.value='bible';search.dispatchEvent(new x.w.Event('input',{bubbles:true}));
    const buttons=[...drawer.querySelectorAll('[data-ux02-view]:not([hidden])')];
    assert.deepEqual(buttons.map(b=>b.dataset.ux02View),['bible']);
    buttons[0].click();
    assert.equal(x.destinations.at(-1),'bible');
    assert.equal(drawer.hidden,true);
    assert.equal(x.doc.getElementById('view-bible').classList.contains('active'),true);
  }finally{x.close()}
});


test('Phase 15 keeps search and Quick Access when the late v101 sidebar replaces the groups',async()=>{
  const x=fixture();
  try{
    const nav=x.doc.querySelector('.sidebar .nav-menu');
    const legacy=x.doc.createElement('section');
    legacy.className='v101-nav-group collapsed';
    legacy.dataset.group='Plan';
    const head=x.doc.createElement('button');head.className='v101-nav-group-head';
    head.setAttribute('aria-expanded','false');
    const body=x.doc.createElement('div');body.className='v101-nav-group-body';
    x.doc.querySelectorAll('.sidebar .nav-item[data-view]').forEach(button=>body.appendChild(button));
    legacy.append(head,body);nav.replaceChildren(legacy);
    await Promise.resolve();await Promise.resolve();await Promise.resolve();
    assert.equal(x.doc.querySelectorAll('.sidebar .nav-item[data-view]').length,30);
    assert.equal(x.doc.querySelector('.sidebar').classList.contains('ux15-legacy'),true);
    const search=x.doc.getElementById('ux15-nav-search');
    assert.ok(search?.isConnected,'Search must be reinserted after legacy rebuild');
    assert.equal(x.doc.querySelectorAll('.sidebar .ux15-shortcut').length,4);
    search.value='bible';search.dispatchEvent(new x.w.Event('input',{bubbles:true}));
    assert.deepEqual([...nav.querySelectorAll('.nav-item[data-view]:not([hidden])')].map(b=>b.dataset.view),['bible']);
    assert.equal(legacy.classList.contains('collapsed'),false);
    search.value='';search.dispatchEvent(new x.w.Event('input',{bubbles:true}));
    assert.equal(legacy.classList.contains('collapsed'),true,'Native expanded/collapsed preference restored');
    x.doc.querySelector('[data-ux15-view="notes"]').click();
    assert.equal(x.destinations.at(-1),'notes');
  }finally{x.close()}
});


test('Phase 15 restores quick tools when OmniOS replaces the entire sidebar DOM node',async()=>{
  const x=fixture();
  try{
    const original=x.doc.querySelector('aside.sidebar');
    const sidebar=x.doc.createElement('aside');sidebar.className='sidebar v101-sidebar';
    const nav=x.doc.createElement('nav');nav.className='nav-menu';
    const group=x.doc.createElement('section');group.className='v101-nav-group';
    const body=x.doc.createElement('div');body.className='v101-nav-group-body';
    original.querySelectorAll('.nav-item[data-view]').forEach(button=>body.appendChild(button));
    group.appendChild(body);nav.appendChild(group);sidebar.appendChild(nav);original.replaceWith(sidebar);
    await Promise.resolve();await Promise.resolve();await Promise.resolve();
    assert.ok(sidebar.querySelector('.ux15-search-input'),'Search reattached on new sidebar');
    assert.equal(sidebar.querySelectorAll('.ux15-shortcut').length,4);
    assert.equal(sidebar.querySelectorAll('.nav-item[data-view]').length,30);
    assert.equal(sidebar.classList.contains('ux15-legacy'),true);
  }finally{x.close()}
});

test('Phase 15 search / shortcuts have responsive, accessible presentation without storage mutations',()=>{
  for(const name of ['ux15-nav-tools','ux15-search-input','ux15-shortcut','ux15-drawer-search',
    'ux02-drawer-destination[hidden]','prefers-reduced-motion:reduce'])assert.ok(css.includes(name),name);
  assert.match(js,/aria-keyshortcuts/);
  assert.match(js,/aria-live/);
  assert.match(js,/target\?\.closest\?\.\('input,textarea,select,\[contenteditable="true"\]'\)/);
  assert.doesNotMatch(js,/localStorage\.setItem|indexedDB\.open|location\.href\s*=/);
  assert.doesNotMatch(js,/innerHTML\s*=\s*(?:[a-zA-Z_$][\w$]*|["']<div)/);
});
