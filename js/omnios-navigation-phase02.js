/* OmniOS Phase 02 — navigation projection, not a router or state migration. */
(function () {
  'use strict';
  if (window.OmniNav02) return;
  const GROUPS = [
    {id:'today', label:'Today', icon:'home', landing:'today',
      views:['today','dashboard','inbox']},
    {id:'plan', label:'Plan', icon:'calendar', landing:'planner',
      views:['planner','master-calendar','tasks','projects','routine','habits','goals','reminders','focus','automations']},
    {id:'life', label:'Life', icon:'heart', landing:'life-hub',
      views:['life-hub','workout','diet','budget','grocery','pantry','wishlist']},
    {id:'library', label:'Library', icon:'book', landing:'notes',
      views:['notes','bible','templates','relations','activity','studio','data-center','passwords','settings','help']}
  ];
  const LABELS = {
    'master-calendar':'Calendar',diet:'Nutrition',budget:'Finance',
    'life-hub':'Life Hub','data-center':'Data Center',inbox:'Inbox',
    'today':'Today',dashboard:'Dashboard',notes:'Notes',bible:'Bible'
  };
  const groupForView = new Map();
  GROUPS.forEach(g=>g.views.forEach(v=>groupForView.set(v,g.id)));
  const state = {active:'today',dialog:null,trigger:null,buttons:[],groups:new Map(),installed:false,searchInput:null,shortcuts:[],query:''};
  const byId=id=>document.getElementById(id);
  const viewNode=id=>byId('view-'+id);
  const visibleView=()=>document.querySelector('.view.active[id^="view-"]')?.id.slice(5)||'today';
  const groupId=id=>groupForView.get(id)||'library';
  const group=id=>GROUPS.find(g=>g.id===id);
  function el(tag,cls,text){
    const x=document.createElement(tag);
    if(cls)x.className=cls;
    if(text!==undefined)x.textContent=text;
    return x;
  }
  function icon(name){
    const paths={
      home:'<path d="m3 10 9-7 9 7v10H3z"/><path d="M9 20v-7h6v7"/>',
      calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
      heart:'<path d="M20.8 8.5c0 4.8-8.8 10.2-8.8 10.2S3.2 13.3 3.2 8.5a4.7 4.7 0 0 1 8.8-2.2 4.7 4.7 0 0 1 8.8 2.2z"/>',
      book:'<path d="M12 6c-3.6-2.4-6.6-2.4-9-1v14c3-1.4 6-1.4 9 1 3-2.4 6-2.4 9-1V5c-3-1.4-6-1.4-9 1Z"/><path d="M12 6v14"/>',
      plus:'<path d="M12 4v16M4 12h16"/>',
      check:'<path d="m4 12 5 5L20 6"/><path d="M4 5h9"/>'
    };
    const span=el('span','ux02-nav-icon');
    span.setAttribute('aria-hidden','true');
    span.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">'+paths[name]+'</svg>';
    return span;
  }
  function allViews(){
    const raw=[...document.querySelectorAll('.sidebar .nav-item[data-view]')];
    const seen=new Map();
    raw.forEach(b=>{const id=b.dataset.view;if(id&&!seen.has(id))seen.set(id,b)});
    return seen;
  }
  function knownScreens(){
    return [...document.querySelectorAll('.view[id^="view-"]')].map(v=>v.id.slice(5)).filter(Boolean);
  }

  // Phase 15: shortcuts are projections of existing routes, never replacement screens.
  // Search filters the original navigation buttons without changing their handlers.
  function simplify(value){
    return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase().trim();
  }
  function navigationTools(){
    const tools=el('section','ux15-nav-tools');
    tools.setAttribute('aria-label','Find and open pages');
    const search=el('div','ux15-search');
    const label=el('label','ux15-search-label','Search pages');
    label.htmlFor='ux15-nav-search';
    const field=el('div','ux15-search-field');
    const input=el('input','ux15-search-input');
    input.type='search';input.id='ux15-nav-search';input.autocomplete='off';
    input.spellcheck=false;input.placeholder='Find a page…';
    input.setAttribute('aria-keyshortcuts','/');
    const key=el('kbd','ux15-search-key','/');
    field.append(input,key);search.append(label,field);tools.append(search);
    const shortcuts=el('div','ux15-shortcuts');
    const eyebrow=el('div','ux15-shortcuts-heading','QUICK ACCESS');
    const grid=el('div','ux15-shortcuts-grid');
    const favourites=[
      {id:'today',text:'Today',glyph:'home'},
      {id:'tasks',text:'Tasks',glyph:'check'},
      {id:'master-calendar',text:'Calendar',glyph:'calendar'},
      {id:'notes',text:'Notes',glyph:'book'}
    ];
    favourites.forEach(item=>{
      if(!viewNode(item.id))return;
      const button=el('button','ux15-shortcut');button.type='button';
      button.dataset.ux15View=item.id;
      button.append(icon(item.glyph),el('span','ux15-shortcut-label',item.text));
      button.addEventListener('click',()=>navigate(item.id));
      grid.appendChild(button);state.shortcuts.push(button);
    });
    shortcuts.append(eyebrow,grid);tools.append(shortcuts);
    const status=el('p','ux15-search-status');
    status.id='ux15-search-status';status.hidden=true;status.setAttribute('role','status');
    status.setAttribute('aria-live','polite');tools.append(status);
    state.searchInput=input;
    input.addEventListener('input',()=>filterNavigation(input.value));
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape'){
        event.preventDefault();input.value='';filterNavigation('');input.blur();
      }else if(event.key==='Enter'&&state.query){
        const first=[...document.querySelectorAll('.sidebar .ux02-side-link:not([hidden])')]
          .find(b=>!b.closest('.ux02-side-group')?.hidden);
        if(first){event.preventDefault();first.click();clearNavigationSearch();}
      }
    });
    return tools;
  }
  function filterNavigation(value){
    state.query=simplify(value);
    const searching=!!state.query;
    const nav=document.querySelector('.sidebar .nav-menu[data-ux02-ready="1"]');
    nav?.classList.toggle('ux15-searching',searching);
    let total=0;
    state.groups.forEach(({section,toggle,panel},key)=>{
      const rows=[...panel.querySelectorAll('.nav-item[data-view]')];
      let count=0;
      rows.forEach(button=>{
        const match=!searching||simplify((LABELS[button.dataset.view]||'')+' '+button.textContent+' '+button.dataset.view).includes(state.query);
        button.hidden=!match;
        if(match)count++;
      });
      total+=searching?count:0;
      section.hidden=searching&&count===0;
      if(searching){
        panel.hidden=count===0;
        toggle.setAttribute('aria-expanded',String(count>0));
        section.classList.toggle('ux02-selected',count>0);
      }
      const number=toggle.querySelector('.ux02-side-count');
      if(number)number.textContent=searching?String(count):String(rows.length);
    });
    const status=byId('ux15-search-status');
    if(status){
      status.hidden=!searching;
      status.textContent=searching?(total?total+' matching '+(total===1?'page':'pages'):'No pages found'):'';
    }
    if(!searching)expand(groupId(visibleView()),false);
  }
  function clearNavigationSearch(){
    if(!state.searchInput)return;
    state.searchInput.value='';filterNavigation('');
  }
  function filterDrawer(query){
    const body=state.dialog?.querySelector('.ux02-drawer-content');
    if(!body)return;
    let count=0;const needle=simplify(query);
    body.querySelectorAll('[data-ux02-view]').forEach(button=>{
      const match=simplify(button.textContent+' '+button.dataset.ux02View).includes(needle);
      button.hidden=!match;if(match)count++;
    });
    const empty=body.querySelector('.ux15-drawer-empty');
    if(empty)empty.hidden=count>0;
  }

  function setupSidebar(){
    const nav=document.querySelector('.sidebar .nav-menu');
    if(!nav||nav.dataset.ux02Ready==='1')return !!nav;
    const named=allViews(),groups=GROUPS.map(g=>({g,rows:[]}));
    const accounted=new Set();
    GROUPS.forEach((g,i)=>g.views.forEach(id=>{
      const b=named.get(id);
      if(b){groups[i].rows.push(b);accounted.add(id);}
    }));
    named.forEach((b,id)=>{if(!accounted.has(id))groups[3].rows.push(b)});
    const carry=[...nav.children].filter(x=>!x.classList.contains('nav-item')&&!x.classList.contains('nav-section'));
    const fragment=document.createDocumentFragment();
    fragment.appendChild(navigationTools());
    groups.forEach(({g,rows})=>{
      const section=el('section','ux02-side-group');
      section.dataset.ux02Group=g.id;
      const toggle=el('button','ux02-side-toggle');
      toggle.type='button';toggle.dataset.ux02Toggle=g.id;
      toggle.append(icon(g.icon),el('span','ux02-side-title',g.label));
      const count=el('span','ux02-side-count',String(rows.length));count.setAttribute('aria-hidden','true');
      toggle.append(count,el('span','ux02-side-chevron','⌄'));
      const panel=el('div','ux02-side-links');panel.id='ux02-side-'+g.id;panel.hidden=true;
      toggle.setAttribute('aria-controls',panel.id);
      rows.forEach(b=>{b.classList.add('ux02-side-link');panel.appendChild(b)});
      section.append(toggle,panel);fragment.appendChild(section);
      state.groups.set(g.id,{toggle,panel,section});
      toggle.addEventListener('click',()=>expand(g.id,true));
    });
    carry.forEach(x=>fragment.appendChild(x));
    nav.replaceChildren(fragment);
    nav.dataset.ux02Ready='1';
    return true;
  }
  function expand(id,manual){
    if(manual&&state.query)clearNavigationSearch();
    state.groups.forEach((record,key)=>{
      const expanded=key===id;
      record.panel.hidden=!expanded;
      record.toggle.setAttribute('aria-expanded',String(expanded));
      record.section.classList.toggle('ux02-selected',expanded);
    });
    if(manual){const b=state.groups.get(id)?.panel.querySelector('.nav-item.active');if(b)b.scrollIntoView({block:'nearest'})}
  }
  function buttonsForGroup(id){
    const g=group(id),src=allViews(),ids=g?g.views.slice():[];
    if(id==='library')src.forEach((_,key)=>{if(!groupForView.has(key)&&!ids.includes(key))ids.push(key)});
    // Preserve every routable view even if it is not present in the old sidebar.
    if(id==='library')knownScreens().forEach(key=>{if(!groupForView.has(key)&&!ids.includes(key))ids.push(key)});
    return ids.filter(key=>!!viewNode(key)).map(key=>{
      const nav=src.get(key);return {id:key,label:(LABELS[key]||nav?.textContent?.trim()||key.replace(/-/g,' '))};
    });
  }
  function closeDrawer(){
    const d=state.dialog;if(!d||d.hidden)return;
    d.hidden=true;document.body.classList.remove('ux02-drawer-open');
    state.buttons.forEach(b=>b.setAttribute('aria-expanded','false'));
    const previous=state.trigger;state.trigger=null;
    if(previous?.isConnected)previous.focus({preventScroll:true});
  }
  function showDrawer(id,trigger){
    const d=state.dialog;if(!d)return;
    state.trigger=trigger||document.activeElement;
    const g=group(id)||GROUPS[3];
    d.querySelector('.ux02-drawer-title').textContent=g.label;
    const body=d.querySelector('.ux02-drawer-content');
    body.replaceChildren();
    for(const page of buttonsForGroup(g.id)){
      const b=el('button','ux02-drawer-destination',page.label);
      b.type='button';b.dataset.ux02View=page.id;
      if(page.id===visibleView())b.setAttribute('aria-current','page');
      body.appendChild(b);
    }
    const empty=el('p','ux15-drawer-empty','No matching pages');empty.hidden=true;
    body.appendChild(empty);
    const drawerSearch=d.querySelector('.ux15-drawer-search');
    if(drawerSearch)drawerSearch.value='';
    d.dataset.ux02Group=g.id;
    d.hidden=false;
    document.body.classList.add('ux02-drawer-open');
    state.buttons.forEach(b=>b.setAttribute('aria-expanded',String(b.dataset.ux02Group===id)));
    d.querySelector('.ux02-drawer-close').focus({preventScroll:true});
  }
  function navigate(id){
    if(!viewNode(id)||typeof window.switchView!=='function')return;
    closeDrawer();clearNavigationSearch();window.switchView(id);scheduleSync();
  }
  function quickCapture(){
    closeDrawer();
    const button=byId('global-add-btn');
    if(button){button.click();return}
    if(typeof window.openModal==='function')window.openModal('quick-add-modal');
  }
  function setupMobile(){
    const old=document.querySelector('.mobile-nav');
    if(!old||byId('ux02-mobile-nav'))return !!old;
    const dock=el('nav','ux02-mobile-nav');
    dock.id='ux02-mobile-nav';dock.setAttribute('aria-label','OmniOS main sections');
    GROUPS.forEach(g=>{
      const b=el('button','ux02-mobile-tab');
      b.type='button';b.dataset.ux02Group=g.id;
      b.append(icon(g.icon),el('span','ux02-tab-label',g.label));
      if(g.id==='today'){
        b.setAttribute('aria-label','Go to Today');
        b.addEventListener('click',()=>{
          // First tap switches directly to Today; tapping the active Today
          // destination opens its full group (Dashboard and Inbox remain reachable).
          if(visibleView()==='today')showDrawer('today',b);
          else navigate('today');
        });
      }else{
        b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-expanded','false');
        b.addEventListener('click',()=>{
          if(!state.dialog?.hidden&&state.dialog.dataset.ux02Group===g.id){closeDrawer();return}
          showDrawer(g.id,b);
        });
      }
      dock.appendChild(b);state.buttons.push(b);
    });
    const capture=el('button','ux02-mobile-tab ux02-capture');
    capture.type='button';capture.dataset.ux02Capture='true';capture.setAttribute('aria-label','Quick Add');
    capture.append(icon('plus'),el('span','ux02-tab-label','Add'));
    capture.addEventListener('click',quickCapture);dock.appendChild(capture);
    const dialog=el('div','ux02-drawer');
    dialog.id='ux02-nav-drawer';dialog.hidden=true;
    dialog.setAttribute('role','presentation');
    const shade=el('button','ux02-drawer-shade');shade.type='button';shade.setAttribute('aria-label','Close page menu');shade.addEventListener('click',closeDrawer);
    const sheet=el('section','ux02-drawer-sheet');sheet.setAttribute('role','dialog');sheet.setAttribute('aria-modal','true');sheet.setAttribute('aria-label','Browse OmniOS pages');
    const head=el('div','ux02-drawer-head');
    const title=el('h3','ux02-drawer-title','Plan');
    const dismiss=el('button','ux02-drawer-close','Close');dismiss.type='button';dismiss.setAttribute('aria-label','Close page menu');dismiss.addEventListener('click',closeDrawer);
    head.append(title,dismiss);
    const drawerSearchWrap=el('div','ux15-drawer-search-wrap');
    const drawerSearch=el('input','ux15-drawer-search');
    drawerSearch.type='search';drawerSearch.autocomplete='off';drawerSearch.spellcheck=false;
    drawerSearch.placeholder='Search this section…';drawerSearch.setAttribute('aria-label','Search pages in this section');
    drawerSearch.addEventListener('input',()=>filterDrawer(drawerSearch.value));
    drawerSearchWrap.appendChild(drawerSearch);
    const content=el('div','ux02-drawer-content');
    content.addEventListener('click',e=>{const b=e.target.closest('[data-ux02-view]');if(b)navigate(b.dataset.ux02View)});
    sheet.append(head,drawerSearchWrap,content);dialog.append(shade,sheet);
    document.body.append(dock,dialog);state.dialog=dialog;
    document.addEventListener('keydown',e=>{
      if(state.dialog?.hidden)return;
      if(e.key==='Escape'){e.preventDefault();closeDrawer()}
      if(e.key==='Tab'){
        const allowed=[...state.dialog.querySelectorAll('button:not([disabled])')].filter(x=>x.getBoundingClientRect().width>0);
        const first=allowed[0],last=allowed[allowed.length-1];
        if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}
        else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
      }
    });
    return true;
  }
  let syncQueued=false;
  function scheduleSync(){
    if(syncQueued)return;
    syncQueued=true;
    queueMicrotask(()=>{syncQueued=false;sync()});
  }
  function sync(){
    const current=visibleView(),id=groupId(current);
    state.active=id;
    if(state.groups.size){
      // Keep the active destination visible when a deep link or a keyboard shortcut navigates.
      const record=state.groups.get(id);
      if(record?.panel.hidden)expand(id,false);
      state.groups.forEach(({toggle},key)=>toggle.classList.toggle('ux02-active',key===id));
    }
    (state.shortcuts||[]).forEach(b=>{
      const active=b.dataset.ux15View===current;
      b.classList.toggle('active',active);
      if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
    state.buttons.forEach(b=>{
      const active=b.dataset.ux02Group===id;
      b.classList.toggle('active',active);
      if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
    });
  }
  function install(){
    if(state.installed)return;
    if(!setupSidebar()||!setupMobile())return;
    state.installed=true;
    const original=window.switchView;
    if(typeof original==='function'){
      const wrapped=function(){
        const result=original.apply(this,arguments);
        scheduleSync();
        return result;
      };
      wrapped.__ux02Original=original;window.switchView=wrapped;
    }
    const title=byId('view-title');
    if(title)new MutationObserver(()=>scheduleSync()).observe(title,{childList:true,characterData:true,subtree:true});
    document.addEventListener('keydown',event=>{
      if(event.key!=='/'||event.ctrlKey||event.altKey||event.metaKey||event.shiftKey)return;
      const modalVisible=[...document.querySelectorAll('[role="dialog"][aria-modal="true"]')]
        .some(dialog=>!dialog.closest('[hidden]')&&dialog.getClientRects().length>0);
      if(window.innerWidth<=760||modalVisible)return;
      const target=event.target;
      if(target?.closest?.('input,textarea,select,[contenteditable="true"]'))return;
      if(state.searchInput?.isConnected){event.preventDefault();state.searchInput.focus();}
    });
    window.addEventListener('hashchange',()=>scheduleSync());
    window.addEventListener('popstate',()=>scheduleSync());
    document.addEventListener('click',e=>{
      if(e.target.closest('.nav-item[data-view]'))scheduleSync();
    });
    sync();
  }
  window.OmniNav02={groups:GROUPS,openGroup:id=>showDrawer(id),go:navigate,capture:quickCapture,activeGroup:()=>state.active};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});
  else install();
})();
