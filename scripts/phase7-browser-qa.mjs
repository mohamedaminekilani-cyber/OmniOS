import fs from 'node:fs';
import {createHash} from 'node:crypto';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import {spawn,spawnSync} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const release=JSON.parse(fs.readFileSync('dist/release.json','utf8'));
const output='qa-artifacts';fs.mkdirSync(output,{recursive:true});
const chrome=process.env.CHROME_BIN||['google-chrome','google-chrome-stable','chromium','chromium-browser'].find(x=>spawnSync('sh',['-c','command -v '+x]).status===0);
if(!chrome)throw Error('Chrome or Chromium is required');
const server=http.createServer((req,res)=>{
 let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 const full=path.resolve('dist','.'+p);
 if(!full.startsWith(path.resolve('dist')+path.sep)){res.writeHead(403).end();return}
 fs.stat(full,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':full.endsWith('.html')?'text/html; charset=utf-8':full.endsWith('.js')?'text/javascript; charset=utf-8':full.endsWith('.json')?'application/json':full.endsWith('.css')?'text/css':'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(full).pipe(res)});
});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
const url='http://127.0.0.1:'+server.address().port+'/'+release.file;
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'omnios-qa-'));
const port=9229;
const browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--no-proxy-server','--disable-extensions','--no-first-run','--user-data-dir='+profile,'--remote-debugging-port='+port,'--remote-allow-origins=*','about:blank'],{stdio:'ignore'});
const report={release:release.file,sha256:release.sha256,checks:[],screenshots:[],screenshotSignatures:[],errors:[],startedAt:new Date().toISOString()};
let ws,id=0;const awaiting=new Map(),browserErrors=[];
function send(method,params={}){return new Promise((resolve,reject)=>{
 const key=++id,timer=setTimeout(()=>{awaiting.delete(key);reject(Error('CDP timeout '+method))},18000);
 awaiting.set(key,{resolve,reject,timer});ws.send(JSON.stringify({id:key,method,params}));
})}
async function evaluate(expression){
 const result=(await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true,userGesture:true})).result;
 if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
 return result.result?.value;
}
async function poll(fn,timeout=40000){const start=Date.now();while(Date.now()-start<timeout){try{const x=await fn();if(x)return x}catch{}await delay(300)}throw Error('Chrome startup or page readiness timeout')}
function check(name,condition,details={}){report.checks.push({name,ok:!!condition,...details});if(!condition)report.errors.push(name)}
async function setViewport(w,h){await send('Emulation.setDeviceMetricsOverride',{width:w,height:h,deviceScaleFactor:1,mobile:w<761,screenWidth:w,screenHeight:h})}
async function visit(view,theme,width){
 await evaluate('document.documentElement.dataset.theme='+JSON.stringify(theme)+';window.switchView('+JSON.stringify(view)+');true');
 await delay(450);
 const expression='(()=>{const e=document.getElementById('+JSON.stringify('view-'+view)+'),d=document.documentElement,r=e?.getBoundingClientRect();return {exists:!!e,active:!!e?.classList.contains("active"),visible:!!r&&r.width>0&&r.height>0,overflow:d.scrollWidth-d.clientWidth,content:(e?.innerText||"").trim().length}})()';
 const state=await evaluate(expression);
 const modal=await evaluate('!!document.querySelector("#welcome63")');
 check(width+' '+theme+' '+view+' has no blocking welcome overlay',!modal);
 check(width+' '+theme+' '+view+' renders',state.exists&&state.active&&state.visible,{content:state.content});
 check(width+' '+theme+' '+view+' fits viewport',state.overflow<=5,{overflow:state.overflow});
 const png=(await send('Page.captureScreenshot',{format:'jpeg',quality:70,captureBeyondViewport:false,fromSurface:true})).result.data;
 const name=output+'/'+width+'-'+theme+'-'+view+'.jpg';
 const bytes=Buffer.from(png,'base64');
 fs.writeFileSync(name,bytes);report.screenshots.push(name);
 report.screenshotSignatures.push({view,theme,width,sha256:createHash('sha256').update(bytes).digest('hex')});
}
try{
 const endpoint=await poll(async()=>{try{const r=await fetch('http://127.0.0.1:'+port+'/json');return r.ok?(await r.json()).find(x=>x.type==='page')?.webSocketDebuggerUrl:null}catch{return null}},20000);
 ws=new WebSocket(endpoint);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 ws.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id&&awaiting.has(data.id)){const p=awaiting.get(data.id);clearTimeout(p.timer);awaiting.delete(data.id);data.error?p.reject(Error(data.error.message)):p.resolve(data)}else if(data.method==='Runtime.exceptionThrown')browserErrors.push(String(data.params.exceptionDetails?.exception?.description||'JS exception'))});
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Performance.enable');
 await setViewport(1440,900);
 const nav=(await send('Page.navigate',{url})).result;if(nav.errorText)throw Error('Navigation '+nav.errorText);
 await poll(()=>evaluate('typeof window.switchView==="function" && !!document.querySelector("#view-dashboard") && !!document.getElementById("omnios-unified-design-2026")'),45000);
 await delay(1000);
 const welcoming=await evaluate('!!document.querySelector("#welcome63")');
 if(welcoming){
   const closed=await evaluate('(()=>{const button=document.querySelector("#welcome63 [data-w63close]");if(!button)return false;button.click();return true})()');
   check('Welcome screen dismissed through real UI action',closed);
   await poll(()=>evaluate('!document.getElementById("welcome63")'),7000);
 }
 const pages=['dashboard','today','master-calendar','tasks','habits','workout','budget','diet','notes','projects','reminders','settings'];
 for(const page of pages)await visit(page,'dark',1440);
 await setViewport(390,844);for(const page of pages)await visit(page,'light',390);
 await setViewport(360,780);for(const page of ['today','master-calendar','tasks','habits','budget','notes'])await visit(page,'dark',360);

 const dock=await evaluate('(()=>{const nav=document.querySelector(".mobile-nav.omr-mobile-dock");if(!nav)return {found:false};const visible=e=>{const st=getComputedStyle(e),r=e.getBoundingClientRect();return st.display!=="none"&&st.visibility!=="hidden"&&r.width>2&&r.height>2};return {found:true,items:[...nav.querySelectorAll(":scope > button")].map(b=>({name:b.getAttribute("aria-label"),label:b.querySelector(".nav-label")?.textContent?.trim(),icons:[...b.querySelectorAll(":scope > .nav-icon,:scope > .v48-mobile-icon,:scope > .omni-mobile-custom-icon,:scope > .v35-nav-icon,:scope > .v58-nav-icon")].filter(visible).length}))}})()');
 check('Mobile dock renders one icon and one text label per destination',dock.found&&dock.items.length===6&&dock.items.every(i=>i.icons===1&&!!i.label),dock);
 await setViewport(390,844);await evaluate('window.switchView("budget")');await delay(500);
 const picker=await evaluate('(()=>{const n=document.querySelector("#view-budget .v38-month-nav");if(!n)return {found:false};const kids=[...n.children].filter(x=>x.matches("button,.v38-month-label"));const tops=kids.map(x=>Math.round(x.getBoundingClientRect().top));return {found:true,children:kids.length,tops,height:Math.round(n.getBoundingClientRect().height)}})()');
 check('Finance month navigation fits one mobile row',picker.found&&picker.children>=4&&Math.max(...picker.tops)-Math.min(...picker.tops)<=10&&picker.height<=70,picker);
 const financeHeader=await evaluate('(()=>{const h=document.querySelector("#view-budget .v38-finance-head"),a=h?.querySelector(".v38-finance-head-actions"),t=h?.firstElementChild;if(!h||!a||!t)return {found:false};const r=h.getBoundingClientRect(),tr=t.getBoundingClientRect(),ar=a.getBoundingClientRect();return {found:true,height:Math.round(r.height),introHeight:Math.round(tr.height),gap:Math.round(ar.top-tr.bottom)}})()');
 check('Mobile Finance header has no oversized empty flex spacer',financeHeader.found&&financeHeader.height<=285&&financeHeader.introHeight<140&&financeHeader.gap>=0&&financeHeader.gap<=38,financeHeader);

 // Phase 10: verify the actual rendered geometry, not only the CSS sources.
 await setViewport(1440,900);
 const switchShape=await evaluate('(async()=>{const s=document.createElement("button");s.className="settings-toggle";s.type="button";s.setAttribute("role","switch");s.setAttribute("aria-checked","false");document.body.appendChild(s);const a=getComputedStyle(s),w=Math.round(s.getBoundingClientRect().width),h=Math.round(s.getBoundingClientRect().height),leftOff=parseFloat(getComputedStyle(s,"::after").left);s.classList.add("on");s.setAttribute("aria-checked","true");await new Promise(resolve=>setTimeout(resolve,240));const leftOn=parseFloat(getComputedStyle(s,"::after").left);s.remove();return {w,h,leftOff,leftOn}})()');
 check('Switches render as compact centered controls with moving thumb',switchShape.w===50&&switchShape.h===30&&switchShape.leftOff===4&&switchShape.leftOn===24,switchShape);
 for(const view of ['inbox','planner','projects','budget']){
   await evaluate('window.switchView('+JSON.stringify(view)+')');await delay(250);
   const head=await evaluate('(()=>{const v=document.querySelector(".view.active"),h=v?.querySelector(".v35-page-head,.omx-page-heading,.v38-finance-head");if(!h)return {present:false};const r=h.getBoundingClientRect(),p=getComputedStyle(h),first=h.firstElementChild?.getBoundingClientRect();return {present:true,paddingLeft:parseFloat(p.paddingLeft),paddingTop:parseFloat(p.paddingTop),height:r.height,firstInset:first?Math.round(first.left-r.left):null}})()');
   check('Phase 10 '+view+' header has consistent internal spacing',head.present&&head.paddingLeft>=16&&head.paddingTop>=15&&head.height>=65&&head.firstInset>=16,head);
 }
 await setViewport(1024,800);
 for(const view of ['dashboard','inbox','planner','budget'])await visit(view,'dark',1024);
 await setViewport(760,900);
 for(const view of ['projects','settings'])await visit(view,'light',760);

 for(const [width,theme] of [[1440,'dark'],[390,'light']]){
   const hashes=report.screenshotSignatures.filter(x=>x.width===width&&x.theme===theme).map(x=>x.sha256);
   const distinct=new Set(hashes).size;
   check(width+' '+theme+' snapshots differ across real modules',distinct>=Math.ceil(hashes.length/2),{unique:distinct,total:hashes.length});
 }
 const classic=await evaluate('(()=>{const sheet=document.getElementById("omnios-unified-design-2026"),btn=document.getElementById("omni-unified-mode-toggle");if(!btn)return {found:false};if(sheet.disabled)btn.click();const before=!sheet.disabled;btn.click();const classic=sheet.disabled;btn.click();return {found:true,before,classic,restored:!sheet.disabled,mode:localStorage.getItem("omnios_visual_style_2026")}})()');
 check('Classic appearance toggles safely',classic.found&&classic.before&&classic.classic&&classic.restored&&classic.mode==='modern',classic);
 await evaluate('window.switchView("master-calendar")');await delay(500);
 const cal=await evaluate('document.getElementById("view-master-calendar")?.innerText?.trim().length||0');
 check('Calendar is not blank',cal>30,{characters:cal});

 // Phase 01: verify the *real* loader path, not just the assembled HTML.
 // This catches stylesheets lost when index.html replaces its document.
 await setViewport(1440,900);
 const loaderUrl='http://127.0.0.1:'+server.address().port+'/index.html';
 const loaderNav=(await send('Page.navigate',{url:loaderUrl})).result;
 if(loaderNav.errorText)throw Error('Loader navigation '+loaderNav.errorText);
 await poll(()=>evaluate('(()=>{const l=document.getElementById("omnios-ux-foundation-styles");return typeof window.switchView==="function" && !!document.querySelector("#view-dashboard") && !!l && [...document.styleSheets].some(s=>s.ownerNode===l) && getComputedStyle(document.documentElement).getPropertyValue("--ux-space-4").trim()==="16px"})()'),60000);
 // Do not record visual success while the startup screen still occludes content.
 await poll(()=>evaluate('!document.getElementById("omnios-boot-screen") && !document.documentElement.classList.contains("omnios-startup-gate")'),15000);
 await delay(900); // allow deferred first-run welcome UI to appear
 const welcomeOnLoader=await evaluate('!!document.getElementById("welcome63")');
 if(welcomeOnLoader){
   const dismissed=await evaluate('(()=>{const b=document.querySelector("#welcome63 [data-w63close]");if(!b)return false;b.click();return true})()');
   check('Phase 01 real-loader welcome closes through its real button',dismissed);
   await poll(()=>evaluate('!document.getElementById("welcome63")'),8000);
 }
 check('Phase 01 loader has no remaining blocking startup overlay',
   await evaluate('!document.getElementById("omnios-boot-screen") && !document.getElementById("welcome63") && !document.documentElement.classList.contains("omnios-startup-gate")'));
 const uxLoaded=await evaluate('(()=>{const link=document.getElementById("omnios-ux-foundation-styles");const style=[...document.styleSheets].find(s=>s.ownerNode===link);return {link:!!link,loaded:!!style,href:link?.href||"",space:getComputedStyle(document.documentElement).getPropertyValue("--ux-space-4").trim()}})()');
 check('Phase 01 design system survives real loader and is parsed',uxLoaded.link&&uxLoaded.loaded&&uxLoaded.space==='16px',uxLoaded);
 for(const width of [1440,390,360]){
   await setViewport(width,width<500?844:900);
   await evaluate('window.switchView("today")');await delay(450);
   const geom=await evaluate('(()=>{const doc=document.documentElement,view=document.querySelector(".view.active"),title=document.querySelector(".topbar-title"),link=document.getElementById("omnios-ux-foundation-styles");return {active:!!view?.classList.contains("active"),visible:!!view?.getBoundingClientRect().height,link:!!link,overflow:doc.scrollWidth-doc.clientWidth,title:title?.innerText||"",width:innerWidth}})()');
   check('Phase 01 loader Today fits '+width+'px',geom.active&&geom.visible&&geom.link&&geom.overflow<=5,geom);
   check('Phase 01 '+width+'px snapshot is free of startup and welcome overlays',
     await evaluate('!document.getElementById("omnios-boot-screen") && !document.getElementById("welcome63") && !document.documentElement.classList.contains("omnios-startup-gate")'));


   if(width===360){
     const mobileGeometry=await evaluate('(()=>{const anchor=document.querySelector("#view-today .omr-priority-panel .omr-text-link");const fab=document.getElementById("v55-capture-fab"),panel=document.getElementById("v58-attention");if(!anchor||!fab||!panel)return {found:false};const scroller=document.querySelector(".view-container"),previousScroll=scroller?.scrollTop||0,previousPageScroll=document.documentElement.scrollTop;anchor.scrollIntoView({block:"center",inline:"nearest"});const r=anchor.getBoundingClientRect(),f=fab.getBoundingClientRect();const fabVisible=getComputedStyle(fab).display!=="none"&&getComputedStyle(fab).visibility!=="hidden";const overlap=fabVisible&&r.left<f.right&&r.right>f.left&&r.top<f.bottom&&r.bottom>f.top;const buttons=[panel.querySelector("#v58-attention-open"),panel.querySelector("#v58-automation-open")];const bounds=buttons.map(e=>e?.getBoundingClientRect()).filter(Boolean);const sameRow=bounds.length===2&&Math.abs(bounds[0].top-bounds[1].top)<=3&&bounds.every(b=>b.width>70);const sample=document.elementFromPoint(Math.min(innerWidth-6,r.right-7),r.top+r.height/2);const linkClickable=sample===anchor||anchor.contains(sample);if(scroller)scroller.scrollTop=previousScroll;document.documentElement.scrollTop=previousPageScroll;return {found:true,fabVisible,overlap,sameRow,linkClickable,linkRect:{x:r.x,y:r.y,w:r.width,h:r.height},fabRect:{x:f.x,y:f.y,w:f.width,h:f.height},buttonRects:bounds.map(b=>({x:b.x,y:b.y,w:b.width,h:b.height})),hitTag:sample?.tagName,hitId:sample?.id,hitClass:sample?.className}})()');
     report.phase01MobileOverlap=mobileGeometry;
     check('Phase 01 360px Today hides duplicate capture FAB and exposes priority link',mobileGeometry.found&&!mobileGeometry.fabVisible&&!mobileGeometry.overlap&&mobileGeometry.linkClickable,mobileGeometry);
     check('Phase 01 360px attention actions share a readable row',mobileGeometry.found&&mobileGeometry.sameRow,mobileGeometry);
   }
   const shot=(await send('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:false,fromSurface:true})).result.data;
   const name=output+'/phase01-loader-'+width+'-today.jpg';
   const bytes=Buffer.from(shot,'base64');fs.writeFileSync(name,bytes);report.screenshots.push(name);
   report.screenshotSignatures.push({view:'today-loader',theme:'active',width,sha256:createHash('sha256').update(bytes).digest('hex')});
 }

 // Phase 02 tests MUST run after navigating through the actual index.html loader,
 // because the navigation assets are an opt-in overlay beyond the hashed app HTML.
 await setViewport(1440,900);
 await delay(650);
 const nav02Startup=await evaluate('(()=>{const script=document.querySelector("script[src*=omnios-navigation-phase02]"),style=document.getElementById("omnios-ux-phase02-styles"),nav=document.querySelector(".sidebar .nav-menu");return {script:!!script,scriptSrc:script?.src||"",style:!!style,api:!!window.OmniNav02,sidebar:!!nav,groupCount:document.querySelectorAll(".sidebar .ux02-side-group").length,sidebarLinks:nav?.querySelectorAll("[data-view]").length||0,readyState:document.readyState,boot:document.documentElement.dataset.omniosBoot}})()');
 report.phase02Startup=nav02Startup;
 check('Phase 02 script and navigation mounted in real app',
   nav02Startup.script&&nav02Startup.style&&nav02Startup.api&&nav02Startup.sidebar&&nav02Startup.groupCount===4,nav02Startup);

 const desktopNav02=await evaluate('(()=>{const groups=[...document.querySelectorAll(".sidebar .ux02-side-group")].map(e=>e.dataset.ux02Group);const expanded=[...document.querySelectorAll(".sidebar .ux02-side-toggle[aria-expanded=true]")].map(e=>e.dataset.ux02Toggle);const links=[...document.querySelectorAll(".sidebar .nav-item[data-view]")].map(e=>e.dataset.view);const unique=new Set(links);const s=document.getElementById("omnios-ux-phase02-styles");return {groups,expanded,links:links.length,unique:unique.size,styleLoaded:!!s&&[...document.styleSheets].some(x=>x.ownerNode===s)}})()');
 check('Phase 02 desktop preserves routes and displays four navigation groups',
   desktopNav02.groups.join(',')==='today,plan,life,library'&&desktopNav02.expanded.join(',')==='today'&&desktopNav02.links>=30&&desktopNav02.unique===desktopNav02.links&&desktopNav02.styleLoaded,desktopNav02);
 const libraryRoute02=await evaluate('(async()=>{window.switchView("bible");await new Promise(r=>setTimeout(r,0));const active=document.getElementById("view-bible")?.classList.contains("active"),open=document.querySelector("[data-ux02-group=library] .ux02-side-links")?.hidden===false;window.switchView("today");return {active,open}})()');
 check('Phase 02 uses original Bible route and opens Library group',libraryRoute02.active&&libraryRoute02.open,libraryRoute02);
 await setViewport(390,844);await delay(350);
 const dock02=await evaluate('(()=>{const dock=document.getElementById("ux02-mobile-nav"),old=document.querySelector(".mobile-nav.omr-mobile-dock");return {labels:[...(dock?.querySelectorAll(".ux02-tab-label")||[])].map(x=>x.textContent),dockVisible:!!dock&&getComputedStyle(dock).display!=="none",legacyHidden:!!old&&getComputedStyle(old).display==="none",fabHidden:getComputedStyle(document.getElementById("v55-capture-fab")).display==="none",topAddHidden:getComputedStyle(document.getElementById("v35-mobile-add")).display==="none",overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()');
 check('Phase 02 mobile dock has four sections and a capture slot',
   dock02.labels.join(',')==='Today,Plan,Life,Library,Add'&&dock02.dockVisible&&dock02.legacyHidden&&dock02.fabHidden&&dock02.topAddHidden&&dock02.overflow<=5,dock02);
 const today02=await evaluate('(()=>{document.querySelector("#ux02-mobile-nav [data-ux02-group=today]").click();const d=document.getElementById("ux02-nav-drawer"),pages=[...d.querySelectorAll("[data-ux02-view]")].map(x=>x.dataset.ux02View);const open=!d.hidden;d.querySelector(".ux02-drawer-close")?.click();return {open,pages,closed:d.hidden}})()');
 check('Phase 02 Today group exposes Dashboard and Inbox on mobile',
   today02.open&&today02.closed&&['today','dashboard','inbox'].every(x=>today02.pages.includes(x)),today02);
 const plan02=await evaluate('(async()=>{document.querySelector("#ux02-mobile-nav [data-ux02-group=plan]").click();const d=document.getElementById("ux02-nav-drawer"),pages=[...d.querySelectorAll("[data-ux02-view]")].map(x=>x.dataset.ux02View);const open=!d.hidden;d.querySelector("[data-ux02-view=tasks]")?.click();await new Promise(r=>setTimeout(r,0));return {open,pages,active:document.getElementById("view-tasks")?.classList.contains("active"),closed:d.hidden,selected:document.querySelector("#ux02-mobile-nav [data-ux02-group=plan]")?.getAttribute("aria-current")}})()');
 check('Phase 02 Plan sheet navigates to existing Tasks without breaking original ID',
   plan02.open&&plan02.pages.includes('tasks')&&plan02.active&&plan02.closed&&plan02.selected==='page',plan02);
 const quick02=await evaluate('(()=>{document.querySelector("#ux02-mobile-nav [data-ux02-capture]")?.click();const menu=document.getElementById("quick-add-modal"),input=document.getElementById("v55-capture-text"),v4=!!window.OmniCapture04;const result={v4,legacyOpen:!!menu?.classList.contains("active"),captureOpen:!!input,chipCount:document.querySelectorAll(".ux04-type-chip").length,options:menu?.querySelectorAll("[data-quick-type]").length||0};input?.closest(".modal-overlay")?.querySelector("[data-v55-close]")?.click();if(result.legacyOpen&&typeof window.closeModal==="function")window.closeModal("quick-add-modal");return result})()');
 check('Phase 02 Add preserves legacy choices and uses current Phase 04 capture entry',
   quick02.options>=4&&(quick02.v4?quick02.captureOpen&&quick02.chipCount===9:quick02.legacyOpen),quick02);
 await setViewport(360,780);
 await evaluate('window.switchView("today")');await delay(350);
 const narrow02=await evaluate('(()=>{const dock=document.getElementById("ux02-mobile-nav"),rect=dock?.getBoundingClientRect(),buttons=[...(dock?.querySelectorAll("button")||[])].map(x=>x.getBoundingClientRect());return {visible:!!rect&&rect.width>0&&rect.left>=0&&rect.right<=innerWidth+1,minButton:Math.min(...buttons.map(x=>x.width)),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()');
 check('Phase 02 bottom navigation fits a 360px phone',narrow02.visible&&narrow02.minButton>=45&&narrow02.overflow<=5,narrow02);
 for(const width of [1440,390,360]){
   await setViewport(width,width===1440?900:844);
   await evaluate('window.switchView("today")');await delay(150);
   const base64=(await send('Page.captureScreenshot',{format:'jpeg',quality:76,fromSurface:true,captureBeyondViewport:false})).result.data;
   const name=output+'/phase02-'+width+'-today.jpg',bytes=Buffer.from(base64,'base64');
   fs.writeFileSync(name,bytes);report.screenshots.push(name);
   report.screenshotSignatures.push({view:'today-phase02',theme:'active',width,sha256:createHash('sha256').update(bytes).digest('hex')});
 }

 // Phase 03 — focus-first Today retains underlying widgets and Dashboard.
 await setViewport(1440,900);
 await evaluate('window.switchView("today")');
 await poll(()=>evaluate('!!window.OmniToday03 && !!document.querySelector("#ux03-today-controls") && !!document.querySelector("#v58-today-intelligence")'),12000);
 const today03=await evaluate('(()=>{const t=document.getElementById("view-today"),extra=t.querySelector("#v58-today-intelligence"),bar=t.querySelector("#ux03-today-controls"),old={priorities:!!t.querySelector(".omr-priority-panel"),agenda:!!t.querySelector(".omr-agenda-panel"),capture:!!t.querySelector("#v35-today-capture"),habits:!!t.querySelector(".omr-habits-panel")};const initial={present:!!extra,hidden:getComputedStyle(extra).display==="none",expanded:bar.querySelector("#ux03-connected-toggle").getAttribute("aria-expanded")};bar.querySelector("#ux03-connected-toggle").click();const opened={expanded:bar.querySelector("#ux03-connected-toggle").getAttribute("aria-expanded"),visible:getComputedStyle(extra).display!=="none"};bar.querySelector("#ux03-connected-toggle").click();return {old,initial,opened,restored:getComputedStyle(extra).display==="none",commandCount:bar.querySelectorAll(".ux03-command").length}})()');
 check('Phase 03 Today retains action panels and collapses additional intelligence',
   Object.values(today03.old).every(Boolean)&&today03.initial.present&&today03.initial.hidden&&today03.initial.expanded==="false"&&today03.opened.expanded==="true"&&today03.opened.visible&&today03.restored&&today03.commandCount===4,today03);
 const dash03=await evaluate('(async()=>{document.querySelector("#view-today .ux03-command-actions .ux03-command:last-child").click();await new Promise(r=>setTimeout(r,190));const d=document.getElementById("view-dashboard"),active=d?.classList.contains("active"),banner=d?.querySelector("#ux03-dashboard-return"),count=d?.querySelectorAll("#ux03-dashboard-return").length||0;banner?.querySelector(".ux03-return-button")?.click();await new Promise(r=>setTimeout(r,0));return {active,count,returned:document.getElementById("view-today")?.classList.contains("active")}})()');
 check('Phase 03 Insights opens existing Dashboard and returns to Today once',
   dash03.active&&dash03.count===1&&dash03.returned,dash03);
 for(const width of [1440,390,360]){
   await setViewport(width,width===1440?900:844);
   await evaluate('window.switchView("today")');await delay(200);
   const layout=await evaluate('(()=>{const host=document.getElementById("ux03-today-controls"),toggle=document.getElementById("ux03-connected-toggle"),oldNew=document.getElementById("v35-today-add");const r=host?.getBoundingClientRect(),hero=document.querySelector("#view-today .omr-day-hero"),h=hero?.getBoundingClientRect();return {order:!!h&&!!r&&r.top>=h.bottom-3,present:!!host,visible:!!r&&r.width>0,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,collapsed:toggle?.getAttribute("aria-expanded")==="false",oldNewHidden:!!oldNew&&getComputedStyle(oldNew).display==="none",width:innerWidth}})()');
   check('Phase 03 Today command center is responsive at '+width+'px',
     layout.order&&layout.present&&layout.visible&&layout.overflow<=5&&layout.collapsed&&(width>760||layout.oldNewHidden),layout);
   const base64=(await send('Page.captureScreenshot',{format:'jpeg',quality:76,fromSurface:true,captureBeyondViewport:false})).result.data;
   const filename=output+'/phase03-'+width+'-today.jpg',bytes=Buffer.from(base64,'base64');
   fs.writeFileSync(filename,bytes);report.screenshots.push(filename);
   report.screenshotSignatures.push({view:'today-phase03',theme:'active',width,sha256:createHash('sha256').update(bytes).digest('hex')});
 }

 // Phase 04: one universal Add dialog, without writing user data in the test.
 await setViewport(1440,900);
 await evaluate('window.switchView("today")');
 await poll(()=>evaluate('!!window.OmniCapture04 && !!document.getElementById("global-add-btn")'),6000);
 const desktopCapture04=await evaluate('(()=>{document.getElementById("global-add-btn").click();const input=document.getElementById("v55-capture-text"),modal=input?.closest(".modal"),chips=[...(modal?.querySelectorAll("[data-ux04-type]")||[])];return {opened:!!input,role:modal?.getAttribute("role"),labelledBy:modal?.getAttribute("aria-labelledby"),chips:chips.length,legacyOpen:document.getElementById("quick-add-modal")?.classList.contains("active")}})()');
 check('Phase 04 desktop Add opens accessible universal capture with nine type chips',
   desktopCapture04.opened&&desktopCapture04.role==="dialog"&&desktopCapture04.labelledBy==="ux04-capture-title"&&desktopCapture04.chips===9&&!desktopCapture04.legacyOpen,desktopCapture04);
 const typed04=await evaluate('(()=>{const chip=document.querySelector("[data-ux04-type=event]");chip?.click();const input=document.getElementById("v55-capture-text");input.value+=" Team meeting tomorrow at 10am #work";input.dispatchEvent(new Event("input",{bubbles:true}));return {text:input.value,pressed:chip?.getAttribute("aria-pressed"),preview:document.getElementById("v55-capture-preview")?.textContent?.slice(0,160)}})()');
 check('Phase 04 chips update original V55 parser preview without saving',
   typed04.text.startsWith('event ')&&typed04.pressed==='true'&&typed04.preview?.includes('Parsed as event'),typed04);
 const allTypes04=await evaluate('(()=>{document.getElementById("ux04-all-types")?.click();const menu=document.getElementById("quick-add-modal");return {captureClosed:!document.getElementById("v55-capture-text"),menuOpen:!!menu?.classList.contains("active"),choices:menu?.querySelectorAll("[data-quick-type]").length||0}})()');
 check('Phase 04 Browse all creation types uses existing full Quick Add menu',
   allTypes04.captureClosed&&allTypes04.menuOpen&&allTypes04.choices>=19,allTypes04);
 await evaluate('window.closeModal?.("quick-add-modal")');await delay(50);
 for(const width of [390,360]){
   await setViewport(width,844);await evaluate('window.switchView("today")');
   const mobile04=await evaluate('(()=>{const add=document.querySelector("#ux02-mobile-nav [data-ux02-capture]");add?.click();const input=document.getElementById("v55-capture-text"),modal=input?.closest(".modal"),rect=modal?.getBoundingClientRect();const valid=!!rect&&rect.left>=-1&&rect.right<=innerWidth+1&&rect.width>=280&&rect.height<=innerHeight*.87;return {opened:!!input,chipCount:modal?.querySelectorAll("[data-ux04-type]").length||0,valid,scrollOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,rect:rect?{left:rect.left,right:rect.right,width:rect.width}:null}})()');
   check('Phase 04 mobile dock opens universal capture without overflow at '+width+'px',
     mobile04.opened&&mobile04.chipCount===9&&mobile04.valid&&mobile04.scrollOverflow<=5,mobile04);
   const shot=(await send('Page.captureScreenshot',{format:'jpeg',quality:75,fromSurface:true,captureBeyondViewport:false})).result.data;
   const name=output+'/phase04-'+width+'-capture.jpg',bytes=Buffer.from(shot,'base64');
   fs.writeFileSync(name,bytes);report.screenshots.push(name);
   report.screenshotSignatures.push({view:'capture-phase04',theme:'active',width,sha256:createHash('sha256').update(bytes).digest('hex')});
   await evaluate('document.querySelector("#v55-capture-text")?.closest(".modal-overlay")?.querySelector("[data-v55-close]")?.click()');
 }

 // Phase 05: Verify the actual V36/V603 Calendar engine through index.html.
 await setViewport(1440,900);
 await evaluate('window.switchView("master-calendar")');await delay(300);
 const cal05=await evaluate('(()=>{const v=document.getElementById("view-master-calendar"),modes=[...v.querySelectorAll("[data-v36-mode]")].map(b=>b.dataset.v36Mode);return {api:!!window.OmniCalendar05,active:v.classList.contains("active"),modes,host:!!v.querySelector("#v603-mode-host"),eventCount:document.querySelectorAll("#master-calendar-content [data-master-event]").length}})()');
 check('Phase 05 Calendar keeps all five original modes and mount',cal05.api&&cal05.active&&cal05.host&&cal05.modes.join(',')==='workspace,week,month,day,agenda',cal05);
 const month05=await evaluate('(()=>{document.querySelector("#view-master-calendar [data-v36-mode=month]")?.click();const grid=document.querySelector("#view-master-calendar .v36-month-grid"),days=[...(grid?.querySelectorAll(".v36-month-day")||[])];return {mode:window.OmniCalendar05.mode(),grid:!!grid,days:days.length,columns:getComputedStyle(grid).gridTemplateColumns,dates:days.filter(x=>!!x.dataset.masterDate).length}})()');
 check('Phase 05 Month renders a valid date grid',month05.mode==='month'&&month05.grid&&month05.days>=28&&month05.days<=42&&month05.days===month05.dates,month05);
 const rollover05=await evaluate('(()=>{const previousDate=new Date(masterCalendarDate),previousMode=masterCalendarMode;masterCalendarDate=new Date(2026,0,31,12);masterCalendarMode="month";window.renderMasterCalendar();document.getElementById("v36-cal-next")?.click();const first={year:masterCalendarDate.getFullYear(),month:masterCalendarDate.getMonth()+1,day:masterCalendarDate.getDate()};masterCalendarDate=new Date(2028,0,31,12);window.renderMasterCalendar();document.getElementById("v36-cal-next")?.click();const leap={year:masterCalendarDate.getFullYear(),month:masterCalendarDate.getMonth()+1,day:masterCalendarDate.getDate()};masterCalendarDate=previousDate;masterCalendarMode=previousMode;window.renderMasterCalendar();return {first,leap}})()');
 check('Phase 05 month navigation clamps Jan 31 into February including leap years',
   rollover05.first.year===2026&&rollover05.first.month===2&&rollover05.first.day===28&&rollover05.leap.year===2028&&rollover05.leap.month===2&&rollover05.leap.day===29,rollover05);
 for(const width of [1440,390,360]){
   await setViewport(width,width===1440?900:844);
   await evaluate('window.switchView("master-calendar")');
   await evaluate('document.querySelector("#view-master-calendar [data-v36-mode=month]")?.click()');
   await delay(250);
   const measure=await evaluate('(()=>{const grid=document.querySelector("#view-master-calendar .v36-month-grid"),r=grid?.getBoundingClientRect(),modes=document.querySelector("#view-master-calendar .v36-cal-modes"),cells=grid?.querySelectorAll(".v36-month-day").length||0,mode=window.OmniCalendar05?.mode();return {mode,cells,gridVisible:!!r&&r.width>0&&r.height>0,gridFits:!!r&&r.left>=-2&&r.right<=innerWidth+3,tabsVisible:!!modes&&modes.getBoundingClientRect().height>=35&&getComputedStyle(modes.parentElement).display!=="none",tabsDisplay:modes?getComputedStyle(modes).display:null,tabsRect:modes?{x:modes.getBoundingClientRect().x,y:modes.getBoundingClientRect().y,w:modes.getBoundingClientRect().width,h:modes.getBoundingClientRect().height}:null,centerDisplay:modes?.parentElement?getComputedStyle(modes.parentElement).display:null,centerInline:modes?.parentElement?.style.getPropertyValue("display"),modeButtons:modes?[...modes.querySelectorAll("[data-v36-mode]")].map(b=>{const z=b.getBoundingClientRect(),s=getComputedStyle(b);return {name:b.dataset.v36Mode,w:z.width,h:z.height,display:s.display,visible:s.visibility,inside:z.left>=modes.getBoundingClientRect().left-2&&z.right<=modes.getBoundingClientRect().right+2}}):[],overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()');
   check('Phase 05 Month grid and modes fit '+width+'px',measure.mode==='month'&&measure.cells>=28&&measure.gridVisible&&measure.gridFits&&measure.tabsVisible&&measure.modeButtons.length===5&&measure.modeButtons.every(b=>b.w>=43&&b.h>=32&&b.display!=="none"&&b.visible!=="hidden"&&b.inside)&&measure.overflow<=5,measure);
   const shot=(await send('Page.captureScreenshot',{format:'jpeg',quality:76,captureBeyondViewport:false,fromSurface:true})).result.data;
   const name=output+'/phase05-'+width+'-month.jpg',bytes=Buffer.from(shot,'base64');
   fs.writeFileSync(name,bytes);report.screenshots.push(name);
   report.screenshotSignatures.push({view:'month-phase05',theme:'active',width,sha256:createHash('sha256').update(bytes).digest('hex')});
 }
 await setViewport(390,844);
 const modes05=await evaluate('(()=>{const v=document.querySelector("#view-master-calendar"),out=[];for(const name of ["week","agenda","day"]){v.querySelector("[data-v36-mode="+name+"]")?.click();out.push({mode:window.OmniCalendar05.mode(),host:!!v.querySelector("#v603-mode-host"),content:v.querySelector("#v603-mode-host")?.childElementCount||0})}return out})()');
 check('Phase 05 Week, Agenda and Day modes still render through the original engine',modes05.length===3&&modes05.every(x=>x.content>0&&x.host&&['week','agenda','day'].includes(x.mode)),modes05);

 // Phase 08: simulate a late legacy script hiding Calendar's real mobile toolbar.
 // The compatibility adapter must repair those same nodes, not duplicate controls.
 await evaluate('window.switchView("master-calendar")');
 await evaluate('document.querySelector("#view-master-calendar [data-v36-mode=month]")?.click()');
 await delay(150);
 const calendarRepair08=await evaluate('(async()=>{const root=document.getElementById("view-master-calendar"),bar=root.querySelector(".v36-cal-toolbar"),center=bar?.querySelector(".v36-cal-center"),button=bar?.querySelector("[data-v36-mode=month]");if(!center||!button)return {found:false};const original=bar.querySelectorAll("[data-v36-mode]").length;center.hidden=true;center.setAttribute("aria-hidden","true");center.style.setProperty("display","none","important");button.hidden=true;button.style.setProperty("display","none","important");window.OmniCalendar05.refresh();await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));return {found:true,sameToolbar:bar===root.querySelector(".v36-cal-toolbar"),buttonCount:bar.querySelectorAll("[data-v36-mode]").length,original,centerVisible:!center.hidden&&center.getAttribute("aria-hidden")!=="true"&&getComputedStyle(center).display!=="none",buttonVisible:!button.hidden&&getComputedStyle(button).display!=="none",selected:button.getAttribute("aria-pressed"),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()');
 check('Phase 08 Calendar repairs late-hidden mobile tabs without duplicate toolbar',
   calendarRepair08.found&&calendarRepair08.sameToolbar&&calendarRepair08.original===5&&calendarRepair08.buttonCount===5&&calendarRepair08.centerVisible&&calendarRepair08.buttonVisible&&calendarRepair08.selected==='true'&&calendarRepair08.overflow<=5,calendarRepair08);

 // Phase 06 — canonical Life Hub remains the only record renderer.
 await setViewport(1440,900);
 await evaluate('window.switchView("life-hub")');
 await poll(()=>evaluate('!!window.OmniLife06 && !!document.querySelector("#view-life-hub .v43-life-shell") && !!document.querySelector("#ux06-life-links")'),12000);
 const life06=await evaluate('(()=>{const root=document.getElementById("view-life-hub"),tabs=[...root.querySelectorAll(".v43-life-rail .v43-life-btn[data-v43-life]")].map(b=>b.dataset.v43Life),links=[...root.querySelectorAll("#ux06-life-links [data-ux06-module]")].map(b=>b.dataset.ux06Module),hero=root.querySelectorAll(".v43-hero").length;return {api:!!window.OmniLife06,tabs,links,hero,select:!!root.querySelector("#v43-life-select"),overview:!!root.querySelector("#v43-life-content .v43-domain-grid")}})()');
 check('Phase 06 Life Hub retains one renderer, ten domains and six module routes',
   life06.api&&life06.tabs.join(',')==='overview,people,health,home,documents,admin,learning,travel,money,journal,automations'&&life06.links.join(',')==='workout,diet,budget,grocery,pantry,wishlist'&&life06.hero===1&&life06.select&&life06.overview,life06);
 const domain06=await evaluate('(async()=>{const res=[];for(const id of ["people","documents","health","overview"]){const ok=window.OmniLife06.openDomain(id);await new Promise(r=>setTimeout(r,0));const root=document.getElementById("view-life-hub"),active=root.querySelector(".v43-life-rail [data-v43-life].active")?.dataset.v43Life;res.push({id,ok,active,content:!!root.querySelector("#v43-life-content"),heroCount:root.querySelectorAll(".v43-hero").length})}return res})()');
 check('Phase 06 domain navigation retains original renderer and focus targets',
   domain06.length===4&&domain06.every(d=>d.ok&&d.active===d.id&&d.content&&d.heroCount===1),domain06);
 const deepLife06=await evaluate('(async()=>{window.switchView("notes");await new Promise(r=>setTimeout(r,0));const ok=window.OmniLife06.openDomain("documents");await new Promise(r=>setTimeout(r,160));return {ok,active:document.querySelector("#view-life-hub .v43-life-rail .v43-life-btn.active")?.dataset.v43Life,view:document.getElementById("view-life-hub")?.classList.contains("active")}})()');
 check('Phase 06 external shortcut opens a Life Hub domain after legacy render',
   deepLife06.ok&&deepLife06.view&&deepLife06.active==='documents',deepLife06);
 const key06=await evaluate('(async()=>{window.OmniLife06.openDomain("overview");await new Promise(r=>setTimeout(r,0));const card=document.querySelector("#view-life-hub .v43-domain[data-v43-life=people]");const accessible=!!card&&card.getAttribute("role")==="button"&&card.tabIndex===0;if(card)card.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,0));const selected=document.querySelector("#view-life-hub .v43-life-rail .v43-life-btn.active")?.dataset.v43Life;return {accessible,selected}})()');
 check('Phase 06 keyboard Enter opens original People domain',key06.accessible&&key06.selected==='people',key06);
 const module06=await evaluate('(async()=>{const result=window.OmniLife06.openModule("workout");await new Promise(r=>setTimeout(r,0));const workout=document.getElementById("view-workout")?.classList.contains("active");window.switchView("life-hub");await new Promise(r=>setTimeout(r,0));return {result,workout,restored:document.getElementById("view-life-hub")?.classList.contains("active"),links:document.querySelectorAll("#ux06-life-links [data-ux06-module]").length}})()');
 check('Phase 06 related modules route through original navigation and return',module06.result&&module06.workout&&module06.restored&&module06.links===6,module06);
 for(const width of [1440,390,360]){
   await setViewport(width,width===1440?900:844);
   await evaluate('window.switchView("life-hub")');
   await evaluate('window.OmniLife06.openDomain("overview")');
   await delay(200);
   const geo=await evaluate('(()=>{const root=document.getElementById("view-life-hub"),links=root.querySelector("#ux06-life-links"),r=links?.getBoundingClientRect(),select=root.querySelector("#v43-life-select"),sel=select?.getBoundingClientRect(),count=links?.querySelectorAll("[data-ux06-module]").length||0,rail=root.querySelector(".v43-life-rail"),visible=rail&&getComputedStyle(rail).display!=="none";return {width:innerWidth,count,linksVisible:!!r&&r.width>0&&r.right<=innerWidth+4,selectVisible:!!sel&&sel.width>0&&getComputedStyle(select).display!=="none",railVisible:!!visible,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()');
   check('Phase 06 Life Hub fits '+width+'px and exposes correct navigation',
     geo.count===6&&geo.linksVisible&&geo.overflow<=5&&(width>760?geo.railVisible:geo.selectVisible&&!geo.railVisible),geo);
   const data=(await send('Page.captureScreenshot',{format:'jpeg',quality:76,fromSurface:true,captureBeyondViewport:false})).result.data;
   const name=output+'/phase06-'+width+'-life-hub.jpg',bytes=Buffer.from(data,'base64');
   fs.writeFileSync(name,bytes);report.screenshots.push(name);
   report.screenshotSignatures.push({view:'life-hub-phase06',theme:'active',width,sha256:createHash('sha256').update(bytes).digest('hex')});
 }

 // Phase 07 — exercise original routes and responsive module surfaces through index.html.
 const modules07=[
   {id:'workout',control:'#workout-start-btn',name:'Workout'},
   {id:'diet',control:'#nut-log-now',name:'Nutrition'},
   {id:'budget',control:'#v38-add-txn',name:'Finance'},
   {id:'habits',control:'.omx-habits-head .btn-primary',name:'Habits'},
   {id:'notes',control:'#org-note-search',name:'Notes'}
 ];
 for(const width of [1440,390,360]){
   await setViewport(width,width===1440?900:844);
   for(const item of modules07){
     await evaluate('window.switchView('+JSON.stringify(item.id)+')');await delay(140);
     const layout=await evaluate('(()=>{const id='+JSON.stringify(item.id)+',sel='+JSON.stringify(item.control)+',root=document.getElementById("view-"+id),c=root?.querySelector(sel),r=c?.getBoundingClientRect(),visible=!!r&&r.width>0&&r.height>0,css=root&&getComputedStyle(root);return {id,active:!!root?.classList.contains("active"),visible,control:c?.textContent?.trim().slice(0,70)||sel,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,prepared:!!window.OmniModules07,rendered:!!css&&css.display!=="none"}})()');
     check('Phase 07 '+item.name+' renders and primary action fits '+width+'px',
       layout.active&&layout.visible&&layout.prepared&&layout.rendered&&layout.overflow<=5,layout);
     const image=(await send('Page.captureScreenshot',{format:'jpeg',quality:72,captureBeyondViewport:false,fromSurface:true})).result.data;
     const filename=output+'/phase07-'+width+'-'+item.id+'.jpg',bytes=Buffer.from(image,'base64');
     fs.writeFileSync(filename,bytes);report.screenshots.push(filename);
     report.screenshotSignatures.push({view:item.id+'-phase07',theme:'active',width,sha256:createHash('sha256').update(bytes).digest('hex')});
   }
 }
 await setViewport(390,844);

 const notesHero07=await evaluate('(()=>{const r=document.getElementById("view-notes");window.switchView("notes");const hero=r.querySelector(".org-hero"),newNote=r.querySelector("#org-note-new");const h=hero?.getBoundingClientRect(),b=newNote?.getBoundingClientRect();return {hero:!!h,create:!!b,within:!!h&&!!b&&b.left>=h.left-3&&b.right<=h.right+3,display:newNote&&getComputedStyle(newNote).display}})()');
 check('Phase 07 Notes primary create action stays inside its mobile hero',
   notesHero07.hero&&notesHero07.create&&notesHero07.within,notesHero07);
 // Notes V40 renders .org-seg, not the legacy .org-view-switch. Check actual
 // phone-width geometry and accessible selection without creating records.
 for(const width of [390,360]){
   await setViewport(width,844);
   await evaluate('window.switchView("notes")');await delay(140);
   const notesControls=await evaluate('(()=>{const root=document.getElementById("view-notes"),group=root?.querySelector(".org-toolbar .org-seg"),rail=root?.querySelector(".org-rail"),search=root?.querySelector("#org-note-search"),rect=group?.getBoundingClientRect(),tabs=[...(group?.querySelectorAll("[data-org-view]")||[])].map(b=>({active:b.classList.contains("active"),pressed:b.getAttribute("aria-pressed"),h:b.getBoundingClientRect().height})),scope=[...(rail?.querySelectorAll("[data-note-scope]")||[])].map(b=>({active:b.classList.contains("active"),pressed:b.getAttribute("aria-pressed")}));return {width:innerWidth,groupLabel:group?.getAttribute("aria-label"),groupRole:group?.getAttribute("role"),rect:rect?{left:rect.left,right:rect.right}:null,searchLabel:search?.getAttribute("aria-label"),railLabel:rail?.getAttribute("aria-label"),tabs,scope,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()');
   check('Phase 07 Notes mobile layout tabs are visible and accessible at '+width+'px',
     notesControls.groupRole==='group'&&notesControls.groupLabel==='Notes layout'&&notesControls.searchLabel==='Search notes'&&notesControls.railLabel==='Note collections'&&notesControls.tabs.length===3&&notesControls.tabs.every(x=>x.h>=43&&x.pressed===String(x.active))&&notesControls.tabs.filter(x=>x.active).length===1&&notesControls.scope.every(x=>x.pressed===String(x.active))&&notesControls.rect?.left>=-2&&notesControls.rect?.right<=width+3&&notesControls.overflow<=5,notesControls);
 }
 await setViewport(390,844);
 await evaluate('document.querySelector("#view-notes [data-org-view=\'notes|list\']")?.click()');
 await delay(140);
 const notesListState=await evaluate('(()=>{const root=document.getElementById("view-notes"),list=root?.querySelector("[data-org-view=\'notes|list\']"),cards=root?.querySelector("[data-org-view=\'notes|cards\']");return {listActive:list?.classList.contains("active"),listPressed:list?.getAttribute("aria-pressed"),cardsPressed:cards?.getAttribute("aria-pressed"),rendered:!!root?.querySelector("#notes-grid")}})()');
 check('Phase 07 Notes selection updates when the original List renderer runs',
   notesListState.listActive&&notesListState.listPressed==='true'&&notesListState.cardsPressed==='false'&&notesListState.rendered,notesListState);
 await evaluate('document.querySelector("#view-notes [data-org-view=\'notes|cards\']")?.click()');
 const interactions07=await evaluate('(()=>{const out=[];const tests=[["workout","#workout-start-btn"],["diet","#nut-log-now"],["budget","#v38-add-txn"],["habits",".omx-habits-head .btn-primary"],["notes","#org-note-new"]];for(const [view,button] of tests){window.switchView(view);const root=document.getElementById("view-"+view),target=root?.querySelector(button);if(!target){out.push({view,found:false});continue}const before=[...document.querySelectorAll(".modal-overlay.active,#nut-entry-modal")].length;target.click();const after=[...document.querySelectorAll(".modal-overlay.active,#nut-entry-modal")].length;out.push({view,found:true,opened:after>before,before,after});document.querySelectorAll(".modal-overlay.active").forEach(e=>e.classList.remove("active"));const nut=document.getElementById("nut-entry-modal");if(nut)nut.remove();}return out})()');
 check('Phase 07 original modal actions open for Workout, Nutrition, Finance, Habits and Notes',
   interactions07.length===5&&interactions07.every(x=>x.found&&x.opened),interactions07);

 // Phase 08 telemetry: record real-loader startup and route-to-painted-frame timing.
 // Informational performance samples are deliberately not rigid time budgets:
 // CI host variability must not create false positives. Functional checks still gate.
 await setViewport(390,844);
 const perf08=await evaluate('(async()=>{const nav=performance.getEntriesByType("navigation")[0],samples=[];for(const view of ["today","life-hub","workout","diet","budget","notes"]){const t=performance.now();window.switchView(view);await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));const root=document.getElementById("view-"+view);samples.push({view,paintMs:Math.round((performance.now()-t)*10)/10,active:!!root?.classList.contains("active"),overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth})}return {navigation:{domContentLoadedMs:nav?Math.round(nav.domContentLoadedEventEnd):null,loadEventMs:nav?Math.round(nav.loadEventEnd):null,transferBytes:nav?.transferSize??null},samples,heapBytes:performance.memory?.usedJSHeapSize??null,visibility:document.visibilityState}})()');
 report.performance08=perf08;
 check('Phase 08 collects painted navigation timings with original routes',
   perf08?.samples?.length===6&&perf08.samples.every(x=>Number.isFinite(x.paintMs)&&x.paintMs>=0&&x.active&&x.overflow<=5),perf08);
 // Phase 08: exercise the REAL index.html startup gate rather than timing only
 // the prebuilt app.*.html used by the visual suite. A first visit populates the
 // validated release cache; a reload measures the warm cached path.
 const appReady='typeof window.switchView==="function"&&!!window.OmniNav02&&!!window.OmniToday03&&!!window.OmniModules07&&!!window.OmniLife06&&!!window.OmniCalendar05&&!!document.querySelector(".view.active[id^=view-]")&&!!document.getElementById("omnios-unified-design-2026")';
 const loaderURL=new URL('index.html',url).href;
 async function loaderMetric(kind){
   await poll(()=>evaluate(appReady),75000);
   // Wait for the first stable painted frame after all deferred UX bridges install.
   await evaluate('new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)))');
   const info=await evaluate('(async()=>{const nav=performance.getEntriesByType("navigation")[0],resources=performance.getEntriesByType("resource"),pointer=await (async()=>{try{const c=await caches.open("secondbrain-releases-v1");return !!(await c.match(new URL("./__active_release__",location.href).href))}catch{return false}})();return {readyMs:Math.round(performance.now()),domContentLoadedMs:nav?Math.round(nav.domContentLoadedEventEnd):null,resourceCount:resources.length,releaseRequests:resources.filter(e=>/\\/release\\.json(?:$|\\?)/.test(e.name)).length,appRequests:resources.filter(e=>/\\/app\\.[a-f0-9]{20}\\.html(?:$|\\?)/.test(e.name)).length,cachePointer: pointer,app:!!window.OmniModules07&&!!window.OmniLife06&&!!window.OmniCalendar05,activeView:document.querySelector(".view.active[id^=view-]")?.id||"",overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth}})()');
   // These CDP metrics are diagnostics: no cross-machine speed claim.
   const counters=(await send('Performance.getMetrics')).result.metrics||[];
   const picked=Object.fromEntries(counters.filter(m=>['ScriptDuration','TaskDuration','LayoutDuration','RecalcStyleDuration','JSHeapUsedSize','Nodes','Documents'].includes(m.name)).map(m=>[m.name,Math.round(m.value*1000)/1000]));
   return {kind,...info,cdp:picked};
 }
 await setViewport(390,844);
 const startedCold=await send('Page.navigate',{url:loaderURL});
 if(startedCold.result?.errorText)throw Error('Cold index loader navigation: '+startedCold.result.errorText);
 const cold08=await loaderMetric('cold');
 const startedWarm=await send('Page.reload',{ignoreCache:false});
 if(startedWarm.result?.errorText)throw Error('Warm index loader reload: '+startedWarm.result.errorText);
 const warm08=await loaderMetric('warm');
 // Sample two more warm loads to avoid treating one CI scheduling spike
 // as a reproducible startup regression or improvement.
 const warmRuns=[warm08];
 for(let i=0;i<2;i++){
   await send('Page.reload',{ignoreCache:false});
   warmRuns.push(await loaderMetric('warm-'+(i+2)));
 }
 const warmMedianMs=[...warmRuns].map(x=>x.readyMs).sort((a,b)=>a-b)[1];
 report.startup08={cold:cold08,warm:warm08,warmRuns,warmMedianMs};
 check('Phase 08 real index loader cold/warm startup preserves validated cache and routes',
   [cold08,...warmRuns].every(x=>Number.isFinite(x.readyMs)&&x.readyMs>=0&&x.cachePointer&&x.app&&x.activeView.startsWith('view-')&&x.overflow<=5),report.startup08);

 // Test synthetic persisted user-like records across the rollback. Never touch
 // OmniOS's real state store or personal records, only isolated CI canaries.
 const canary08=await evaluate('(async()=>{const rows=Array.from({length:1000},(_,i)=>({id:i,title:"Synthetic item "+i,done:i%3===0}));localStorage.setItem("omnios_ux08_synthetic_canary",JSON.stringify(rows));return rows.length})()');
 check('Phase 08.4 seeds 1000 synthetic persistent records without modifying OmniOS data',canary08===1000);

 // Phase 08.4: damage ONLY the synthetic browser profile's active pointer,
 // keep a verified previous release and verify the app boots without network.
 const seeded08=await evaluate('(async()=>{const c=await caches.open("secondbrain-releases-v1"),a=new URL("./__active_release__",location.href).href,b=new URL("./__previous_valid_release__",location.href).href,r=await c.match(a);if(!r)return false;await c.put(b,r.clone());await c.put(a,new Response("corrupt-active-release",{headers:{"Content-Type":"application/json"}}));return true})()');
 check('Phase 08.4 seeds recoverable damaged active pointer in isolated browser profile',seeded08);
 // Prohibit downloading a replacement app or manifest; the rollback must rely
 // solely on the previously verified cached release in this synthetic profile.
 await send('Network.setBlockedURLs',{urls:['*release.json*','*source-release.json*','*/app-parts/*','*/app.*.html']});
 await send('Page.reload',{ignoreCache:false});
 const recovery08=await loaderMetric('verified-backup-recovery');
 await send('Network.setBlockedURLs',{urls:[]});
 // Repair the active pointer in the synthetic profile after the test.
 const restored08=await evaluate('(async()=>{const c=await caches.open("secondbrain-releases-v1"),a=new URL("./__active_release__",location.href).href,b=new URL("./__previous_valid_release__",location.href).href,r=await c.match(b);if(!r)return false;await c.put(a,r.clone());return true})()');
 const canaryAfter08=await evaluate('(()=>{const text=localStorage.getItem("omnios_ux08_synthetic_canary"),rows=text&&JSON.parse(text);localStorage.removeItem("omnios_ux08_synthetic_canary");return {length:rows?.length||0,first:rows?.[0]?.title,last:rows?.[999]?.title}})()');
 report.startup08.recovery=recovery08;
 check('Phase 08.4 corrupted active release falls back to the SHA-verified previous release',
   seeded08&&restored08&&recovery08.app&&recovery08.activeView.startsWith('view-')&&recovery08.overflow<=5,recovery08);
 check('Phase 08.4 preserves 1000 synthetic records through verified-cache recovery',
   canaryAfter08.length===1000&&canaryAfter08.first==='Synthetic item 0'&&canaryAfter08.last==='Synthetic item 999',canaryAfter08);
 // Timings are diagnostic, not a brittle CI budget. No claim of a speedup
 // without a comparable user-device baseline and repeated samples.
 report.browserExceptions=browserErrors.slice(0,30);
 check('No uncaught browser runtime exceptions',browserErrors.length===0,{errors:report.browserExceptions});
}catch(e){report.errors.push('Browser QA error: '+String(e?.message||e));report.browserExceptions=browserErrors.slice(-20)}
finally{
 report.finishedAt=new Date().toISOString();
 fs.writeFileSync(output+'/phase7-report.json',JSON.stringify(report,null,2)+'\n');
 for(const p of awaiting.values())clearTimeout(p.timer);
 try{ws?.close()}catch{}browser.kill('SIGTERM');server.close();
 try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:150})}catch{}
 console.log(JSON.stringify({tests:report.checks.length,failed:report.errors,screenshots:report.screenshots.length},null,2));
}
if(report.errors.length)process.exitCode=1;
