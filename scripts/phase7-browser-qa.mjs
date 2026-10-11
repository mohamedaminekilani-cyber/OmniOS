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
 await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
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
 report.browserExceptions=browserErrors.slice(0,30);
 check('No uncaught browser runtime exceptions',browserErrors.length===0,{errors:report.browserExceptions});
}catch(e){report.errors.push('Browser QA error: '+String(e?.message||e))}
finally{
 report.finishedAt=new Date().toISOString();
 fs.writeFileSync(output+'/phase7-report.json',JSON.stringify(report,null,2)+'\n');
 for(const p of awaiting.values())clearTimeout(p.timer);
 try{ws?.close()}catch{}browser.kill('SIGTERM');server.close();
 try{fs.rmSync(profile,{recursive:true,force:true,maxRetries:4,retryDelay:150})}catch{}
 console.log(JSON.stringify({tests:report.checks.length,failed:report.errors,screenshots:report.screenshots.length},null,2));
}
if(report.errors.length)process.exitCode=1;
