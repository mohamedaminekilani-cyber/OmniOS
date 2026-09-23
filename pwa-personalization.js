(function(){
'use strict';
if(window.OmniPWA623)return;

var API=window.OmniPWA623={version:'62.3'};
var USER_CACHE='omnios-user-assets-v1';
var APP_ICON_URL='./omnios-user-icon-192.png';
var APP_ICON_PREVIEW='omnios_app_icon_preview_v1';
var APP_ICON_MARKER='omnios_custom_app_icon_v1';
var APP_ICON_REV='omnios_app_icon_rev_v1';
var BOOT_ICON_KEY='omnios_loading_icon_v1';
var DEVICE_KEY='omnios_push_device_v1';
var PUSH_PUBLIC_KEY='BFspp6Cwz1U5Ewgen29Pyq05WaD15s0VEN6HBA4wo9XiVHZIy6gR_dygjshuOX-lfpE8f3_EwsxtXYoJvPbIqwU';
var PUSH_ENDPOINT='https://omnios-pwa.netlify.app/api/push/register';
var syncTimer=0;

function S(v){return String(v==null?'':v)}
function esc(v){return S(v).replace(/[&<>"']/g,function(ch){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[ch]})}
function toast(msg){try{if(window.toast)return window.toast(msg)}catch(_){} console.log(msg)}
function stateObj(){try{return state}catch(_){return null}}
function settings(){
  var st=stateObj();
  if(!st)return {};
  st.settings=st.settings&&typeof st.settings==='object'?st.settings:{};
  st.settings.notifications=st.settings.notifications&&typeof st.settings.notifications==='object'?st.settings.notifications:{};
  var n=st.settings.notifications;
  if(n.pushEnabled===undefined)n.pushEnabled=false;
  if(n.routineReminders===undefined)n.routineReminders=true;
  if(!n.dailySummaryTime)n.dailySummaryTime='08:00';
  if(n.weeklyReviewDay===undefined)n.weeklyReviewDay=0;
  if(!n.weeklyReviewTime)n.weeklyReviewTime='18:00';
  return n;
}
function currentTab(){
  try{return typeof currentSettingsTab!=='undefined'?currentSettingsTab:''}catch(_){return ''}
}
function standalone(){
  return !!(window.matchMedia&&window.matchMedia('(display-mode: standalone)').matches) || navigator.standalone===true;
}
function iosNeedsInstall(){
  return ('standalone' in navigator) && !standalone();
}
function deviceId(){
  var id='';
  try{id=localStorage.getItem(DEVICE_KEY)||''}catch(_){}
  if(!id){
    id=(crypto.randomUUID?crypto.randomUUID():'dev-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
    try{localStorage.setItem(DEVICE_KEY,id)}catch(_){}
  }
  return id.replace(/[^a-zA-Z0-9_-]/g,'').slice(0,120);
}
function timezone(){
  try{return Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC'}catch(_){return'UTC'}
}
function localDate(d){
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function addDays(d,n){var x=new Date(d);x.setDate(x.getDate()+n);return x}
function safeSave(){
  try{
    if(typeof saveState==='function')return saveState();
    if(typeof window.saveState==='function')return window.saveState();
  }catch(e){console.warn(e)}
}
function injectStyle(){
  if(document.getElementById('omnios-v623-pwa-style'))return;
  var st=document.createElement('style');st.id='omnios-v623-pwa-style';
  st.textContent=
    '#omnios-pwa-assets-card .omni-pwa-preview{width:46px;height:46px;border-radius:12px;display:grid;place-items:center;overflow:hidden;background:var(--bg-elevated);border:1px solid var(--border-color);flex:none}'+
    '#omnios-pwa-assets-card .omni-pwa-preview img{width:100%;height:100%;object-fit:cover}'+
    '#omnios-pwa-assets-card .omni-pwa-preview span{font-size:18px;font-weight:800;color:var(--accent-cyan)}'+
    '.omni-pwa-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end}'+
    '.omni-push-status{display:inline-flex;align-items:center;gap:6px;font-size:.68rem;font-weight:700;color:var(--text-muted)}'+
    '.omni-push-status:before{content:"";width:7px;height:7px;border-radius:50%;background:var(--text-muted)}'+
    '.omni-push-status.good{color:var(--accent-green)}.omni-push-status.good:before{background:var(--accent-green)}'+
    '.omni-push-status.warn{color:var(--accent-yellow)}.omni-push-status.warn:before{background:var(--accent-yellow)}'+
    '.omni-push-status.bad{color:var(--accent-red)}.omni-push-status.bad:before{background:var(--accent-red)}'+
    '@media(max-width:760px){#omnios-pwa-assets-card .settings-row,#omnios-push-settings-card .settings-row{grid-template-columns:minmax(0,1fr) auto!important}.omni-pwa-actions{max-width:46vw}.omni-pwa-actions .btn{font-size:.68rem!important;padding-inline:8px!important}}';
  document.head.appendChild(st);
}
function imageFromFile(file){
  return new Promise(function(resolve,reject){
    var url=URL.createObjectURL(file),img=new Image();
    img.onload=function(){URL.revokeObjectURL(url);resolve(img)};
    img.onerror=function(){URL.revokeObjectURL(url);reject(new Error('Image could not be read'))};
    img.src=url;
  });
}
async function squareImage(file,size){
  if(!file||!/^image\//.test(file.type||''))throw new Error('Choose an image file');
  var img=await imageFromFile(file);
  var side=Math.min(img.naturalWidth||img.width,img.naturalHeight||img.height);
  var sx=((img.naturalWidth||img.width)-side)/2;
  var sy=((img.naturalHeight||img.height)-side)/2;
  var cv=document.createElement('canvas');cv.width=size;cv.height=size;
  var ctx=cv.getContext('2d');
  ctx.clearRect(0,0,size,size);
  ctx.drawImage(img,sx,sy,side,side,0,0,size,size);
  var blob=await new Promise(function(resolve){cv.toBlob(resolve,'image/png',.94)});
  if(!blob)throw new Error('Image conversion failed');
  return {blob:blob,data:cv.toDataURL('image/png')};
}
function applyAppIconLink(){
  var custom=false,rev='';
  try{custom=localStorage.getItem(APP_ICON_MARKER)==='1';rev=localStorage.getItem(APP_ICON_REV)||''}catch(_){}
  var link=document.querySelector('link[rel="apple-touch-icon"]');
  if(link){
    link.setAttribute('sizes','180x180');
    link.href=custom?(APP_ICON_URL+(rev?'?v='+encodeURIComponent(rev):'')):'./icons/icon-192.png';
  }
}
async function saveAppIcon(file){
  var out=await squareImage(file,192);
  if(!('caches'in window))throw new Error('This browser cannot store a custom PWA icon');
  var cache=await caches.open(USER_CACHE);
  var req=new Request(new URL(APP_ICON_URL,location.href).href);
  await cache.put(req,new Response(out.blob,{headers:{'Content-Type':'image/png','Cache-Control':'no-store'}}));
  try{
    localStorage.setItem(APP_ICON_PREVIEW,out.data);
    localStorage.setItem(APP_ICON_MARKER,'1');
    localStorage.setItem(APP_ICON_REV,String(Date.now()));
  }catch(_){}
  applyAppIconLink();
  renderAssetCard();
  toast('Home Screen icon ready. On iPhone, remove the old Home Screen copy and add OmniOS again to apply it.');
}
async function resetAppIcon(){
  try{
    var cache=await caches.open(USER_CACHE);
    await cache.delete(new Request(new URL(APP_ICON_URL,location.href).href),{ignoreSearch:true});
  }catch(_){}
  try{localStorage.removeItem(APP_ICON_PREVIEW);localStorage.removeItem(APP_ICON_MARKER);localStorage.removeItem(APP_ICON_REV)}catch(_){}
  applyAppIconLink();renderAssetCard();toast('Home Screen icon reset.');
}
async function saveBootIcon(file){
  var out=await squareImage(file,160);
  try{localStorage.setItem(BOOT_ICON_KEY,out.data)}catch(e){throw new Error('Could not save the loading icon')}
  renderAssetCard();toast('Loading screen icon saved. It will appear on the next launch.');
}
function resetBootIcon(){
  try{localStorage.removeItem(BOOT_ICON_KEY)}catch(_){}
  renderAssetCard();toast('Loading screen icon reset.');
}
function assetCardHtml(){
  var app='',boot='';
  try{app=localStorage.getItem(APP_ICON_PREVIEW)||'';boot=localStorage.getItem(BOOT_ICON_KEY)||''}catch(_){}
  return '<div class="card settings-section" id="omnios-pwa-assets-card">'+
    '<h3 class="card-title mb-4">App & startup icons</h3>'+
    '<div class="settings-row"><div style="display:flex;align-items:center;gap:10px;min-width:0"><div class="omni-pwa-preview">'+(app?'<img src="'+esc(app)+'" alt="Home Screen icon preview">':'<img src="./icons/icon-192.png" alt="Default OmniOS icon">')+'</div><div><div class="settings-row-label">Home Screen app icon</div><div class="settings-row-desc">Upload a square icon. This preview is the icon prepared for the next Home Screen installation.</div></div></div><div class="omni-pwa-actions"><input id="omni-pwa-icon-file" type="file" accept="image/*" hidden><button type="button" class="btn btn-sm" id="omni-pwa-icon-upload">'+(app?'Replace':'Upload')+'</button>'+(app?'<button type="button" class="btn btn-sm" id="omni-pwa-icon-reset">Reset</button>':'')+'</div></div>'+
    '<div class="settings-row"><div style="display:flex;align-items:center;gap:10px;min-width:0"><div class="omni-pwa-preview">'+(boot?'<img src="'+esc(boot)+'" alt="Loading icon preview">':'<span>↻</span>')+'</div><div><div class="settings-row-label">Loading screen icon</div><div class="settings-row-desc">Replaces the spinner icon on the single OmniOS loading screen.</div></div></div><div class="omni-pwa-actions"><input id="omni-boot-icon-file" type="file" accept="image/*" hidden><button type="button" class="btn btn-sm" id="omni-boot-icon-upload">'+(boot?'Replace':'Upload')+'</button>'+(boot?'<button type="button" class="btn btn-sm" id="omni-boot-icon-reset">Reset</button>':'')+'</div></div>'+
    '<div class="settings-meta-line">'+(app?'✓ Custom Home Screen icon is ready. On iPhone/iPad, remove the old Home Screen copy, open OmniOS in Safari, then Share → Add to Home Screen.':'Upload an icon here before adding OmniOS to the Home Screen.')+'</div>'+
    '</div>';
}
function renderAssetCard(){
  if(currentTab()!=='appearance')return;
  var host=document.getElementById('settings-content');if(!host)return;
  var old=document.getElementById('omnios-pwa-assets-card');if(old)old.remove();
  var wrap=document.createElement('div');wrap.innerHTML=assetCardHtml();var card=wrap.firstElementChild;
  var brand=host.querySelector('#brand54-settings-card');
  if(brand&&brand.nextSibling)host.insertBefore(card,brand.nextSibling);else if(brand)host.appendChild(card);else host.prepend(card);
  var appInput=card.querySelector('#omni-pwa-icon-file'),bootInput=card.querySelector('#omni-boot-icon-file');
  card.querySelector('#omni-pwa-icon-upload').onclick=function(){appInput.click()};
  appInput.onchange=async function(){try{if(appInput.files[0])await saveAppIcon(appInput.files[0])}catch(e){toast(e.message||'Could not save app icon')}};
  var ar=card.querySelector('#omni-pwa-icon-reset');if(ar)ar.onclick=resetAppIcon;
  card.querySelector('#omni-boot-icon-upload').onclick=function(){bootInput.click()};
  bootInput.onchange=async function(){try{if(bootInput.files[0])await saveBootIcon(bootInput.files[0])}catch(e){toast(e.message||'Could not save loading icon')}};
  var br=card.querySelector('#omni-boot-icon-reset');if(br)br.onclick=resetBootIcon;
}
function b64ToBytes(base64){
  var pad='='.repeat((4-base64.length%4)%4),s=(base64+pad).replace(/-/g,'+').replace(/_/g,'/');
  var raw=atob(s),out=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
function pushBackendReady(){
  return new Promise(function(resolve){
    var done=false,img=new Image(),timer=setTimeout(function(){if(!done){done=true;resolve(false)}},4500);
    function finish(ok){if(done)return;done=true;clearTimeout(timer);resolve(ok)}
    img.onload=function(){finish(true)};img.onerror=function(){finish(false)};
    img.src='https://omnios-pwa.netlify.app/api/push/health.svg?t='+Date.now();
  });
}
async function postPush(payload){
  var same=location.hostname==='omnios-pwa.netlify.app';
  var opts={method:'POST',body:JSON.stringify(payload),credentials:'omit'};
  if(same){
    opts.headers={'Content-Type':'application/json'};
  }else{
    opts.mode='no-cors';
    opts.headers={'Content-Type':'text/plain;charset=UTF-8'};
  }
  var response=await fetch(same?'/api/push/register':PUSH_ENDPOINT,opts);
  if(same){
    var data={};try{data=await response.json()}catch(_){}
    if(!response.ok||data.ok===false)throw new Error(data.error||'Push service request failed');
    return data;
  }
  return {ok:true,opaque:true};
}
function addSchedule(out,id,date,time,title,body,view,advanceMinutes){
  if(!date)return;
  var tm=/^\d{2}:\d{2}$/.test(time||'')?time:'09:00';
  var at=new Date(date+'T'+tm+':00');
  if(isNaN(at))return;
  at=new Date(at.getTime()-Math.max(0,Number(advanceMinutes)||0)*60000);
  var now=Date.now(),max=now+60*86400000;
  if(at.getTime()<now-600000||at.getTime()>max)return;
  out.push({id:S(id)+'@'+at.toISOString(),fireAt:at.toISOString(),title:S(title).slice(0,140),body:S(body).slice(0,260),view:S(view||'reminders'),tag:S(id).slice(0,160)});
}
function addInstant(out,id,at,title,body,view){
  var d=new Date(at);if(isNaN(d))return;
  var now=Date.now(),max=now+60*86400000;
  if(d.getTime()<now-600000||d.getTime()>max)return;
  out.push({id:S(id)+'@'+d.toISOString(),fireAt:d.toISOString(),title:S(title).slice(0,140),body:S(body).slice(0,260),view:S(view||'reminders'),tag:S(id).slice(0,160)});
}
function collectSchedules(){
  var st=stateObj();if(!st)return[];
  var n=settings(),out=[];
  try{
    if(window.OmniReminders40&&typeof window.OmniReminders40.all==='function'){
      window.OmniReminders40.all().forEach(function(r){
        if(['completed','dismissed','snoozed'].includes(r.state))return;
        if(r.type==='task'&&n.taskReminders===false)return;
        if(r.type==='event'&&n.eventReminders===false)return;
        if(r.manual&&r.snoozeUntil&&new Date(r.snoozeUntil)>new Date()){
          addInstant(out,'manual:'+r.id,r.snoozeUntil,r.title,r.meta||'Reminder','reminders');return;
        }
        var advance=0;
        if(r.type==='task'){
          var task=(st.entries||[]).find(function(x){return String(x.id)===String(r.id)});
          advance=Number(task&&task.reminderMinutes)||0;
        }else if(r.type==='event'){
          var eventItem=(st.calendarEvents||[]).find(function(x){return String(x.id)===String(r.id)});
          advance=Number(eventItem&&eventItem.reminder!=null?eventItem.reminder:(st.settings&&st.settings.calendar&&st.settings.calendar.defaultReminder))||0;
        }else if(r.type==='bill'){
          var bill=(st.bills||[]).find(function(x){return String(x.id)===String(r.id)});
          advance=(Number(bill&&bill.reminderDays)||0)*1440;
        }else if(r.type==='plan'){
          var plan=(st.paymentPlans||[]).find(function(x){return String(x.id)===String(r.id)});
          advance=(Number(plan&&plan.reminderDays)||0)*1440;
        }else if(r.type==='goal'){
          advance=2*1440;
        }
        addSchedule(out,'rem:'+r.type+':'+r.id,r.date,r.time||'09:00',r.title,r.meta||'OmniOS reminder','reminders',advance);
      });
    }else{
      (st.entries||[]).filter(function(x){return x.status!=='completed'&&!x.completed&&(x.dueDate||x.date)}).forEach(function(x){
        if(n.taskReminders===false)return;
        addSchedule(out,'task:'+x.id,x.dueDate||x.date,x.time||'09:00','Task: '+(x.title||'Task'),'Due in OmniOS','tasks',Number(x.reminderMinutes)||0);
      });
      (st.calendarEvents||[]).forEach(function(x){
        if(n.eventReminders===false)return;
        addSchedule(out,'event:'+x.id,x.date,x.startTime||'09:00',x.title||'Calendar event','Calendar reminder','master-calendar',Number(x.reminder!=null?x.reminder:(st.settings&&st.settings.calendar&&st.settings.calendar.defaultReminder))||0);
      });
    }
  }catch(e){console.warn('Reminder schedule',e)}
  if(n.habitReminders!==false&&(st.habits||[]).length){
    var ht=(st.settings&&st.settings.habits&&st.settings.habits.reminderTime)||'08:00';
    for(var h=0;h<60;h++){var hd=addDays(new Date(),h);addSchedule(out,'habits',localDate(hd),ht,'Habit check-in',(st.habits||[]).length+' habit'+((st.habits||[]).length===1?'':'s')+' waiting for today.','habits',0)}
  }
  if(n.routineReminders!==false&&(st.routines||[]).length){
    (st.routines||[]).filter(function(r){return !r.archived}).forEach(function(r){
      for(var k=0;k<60;k++){
        var d=addDays(new Date(),k),due=false,f=r.frequency||'daily';
        if(f==='daily')due=true;
        else if(f==='weekly')due=!(r.days||[]).length||(r.days||[]).map(Number).includes(d.getDay());
        else if(f==='monthly')due=Number(r.dayOfMonth||1)===d.getDate();
        if(due)addSchedule(out,'routine:'+r.id,localDate(d),r.time||'08:00','Routine: '+(r.name||'Routine'),'Your routine is ready to start.','routine',0);
      }
    });
  }
  if(n.dailySummary!==false){
    for(var ds=0;ds<60;ds++){var dd=addDays(new Date(),ds);addSchedule(out,'daily-summary',localDate(dd),n.dailySummaryTime||'08:00','OmniOS daily summary','Open Today to review tasks, calendar and priorities.','today',0)}
  }
  if(n.weeklyReview!==false){
    for(var wr=0;wr<60;wr++){var wd=addDays(new Date(),wr);if(wd.getDay()===Number(n.weeklyReviewDay||0))addSchedule(out,'weekly-review',localDate(wd),n.weeklyReviewTime||'18:00','Weekly review','Review your week and prepare the next one.','planner',0)}
  }
  var unique=new Map();
  out.sort(function(a,b){return a.fireAt.localeCompare(b.fireAt)}).forEach(function(x){if(!unique.has(x.id))unique.set(x.id,x)});
  return Array.from(unique.values()).slice(0,900);
}
async function subscription(){
  if(!('serviceWorker'in navigator)||!('PushManager'in window))return null;
  var reg=await navigator.serviceWorker.ready;
  return await reg.pushManager.getSubscription();
}
async function enablePush(){
  if(!('Notification'in window)||!('PushManager'in window)||!('serviceWorker'in navigator)){toast('Push notifications are not supported on this browser.');return}
  if(iosNeedsInstall()){toast('On iPhone/iPad, add OmniOS to the Home Screen first, then enable notifications from the installed app.');return}
  var p=Notification.permission;
  if(p!=='granted')p=await Notification.requestPermission();
  if(p!=='granted'){toast('Notification permission was not granted.');renderPushCard();return}
  var reg=await navigator.serviceWorker.ready;
  var sub=await reg.pushManager.getSubscription();
  if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64ToBytes(PUSH_PUBLIC_KEY)});
  if(!(await pushBackendReady()))throw new Error('The OmniOS push service is not online yet. Try again after the latest deployment finishes.');
  settings().pushEnabled=true;
  safeSave();
  await postPush({action:'register',deviceId:deviceId(),subscription:sub.toJSON(),timezone:timezone(),schedules:collectSchedules()});
  toast('Push notifications enabled.');
  renderPushCard();
}
async function disablePush(){
  try{
    var sub=await subscription();
    if(sub)await postPush({action:'unsubscribe',deviceId:deviceId(),subscription:sub.toJSON(),timezone:timezone()});
    if(sub)await sub.unsubscribe();
  }catch(e){console.warn(e)}
  settings().pushEnabled=false;safeSave();toast('Push notifications disabled.');renderPushCard();
}
async function testPush(){
  if(Notification.permission!=='granted'){await enablePush();if(Notification.permission!=='granted')return}
  var sub=await subscription();if(!sub){await enablePush();sub=await subscription();if(!sub)return}
  try{if(!(await pushBackendReady()))throw new Error('The OmniOS push service is not online yet.');await postPush({action:'test',deviceId:deviceId(),subscription:sub.toJSON(),timezone:timezone(),schedules:collectSchedules()});toast('Test push requested.')}catch(e){toast(e.message||'Could not request a test push')}
}
async function syncPush(){
  var n=settings();if(!n.pushEnabled||Notification.permission!=='granted')return;
  try{
    var sub=await subscription();if(!sub)return;
    await postPush({action:'sync',deviceId:deviceId(),subscription:sub.toJSON(),timezone:timezone(),schedules:collectSchedules()});
  }catch(e){console.warn('OmniOS push sync',e)}
}
function queueSync(){clearTimeout(syncTimer);syncTimer=setTimeout(syncPush,1200)}
function pushStatusText(){
  if(!('Notification'in window)||!('PushManager'in window))return{label:'Not supported',cls:'bad'};
  if(iosNeedsInstall())return{label:'Install to Home Screen first',cls:'warn'};
  if(Notification.permission==='denied')return{label:'Blocked in system settings',cls:'bad'};
  if(Notification.permission!=='granted')return{label:'Not enabled',cls:'warn'};
  if(settings().pushEnabled)return{label:'System push enabled',cls:'good'};
  return{label:'Permission granted · push off',cls:'warn'};
}
function pushCardHtml(){
  var s=pushStatusText(),enabled=settings().pushEnabled;
  return '<div class="card settings-section" id="omnios-push-settings-card">'+
    '<div class="flex-between" style="margin-bottom:10px"><div><h3 class="card-title" style="margin:0">System push notifications</h3><div class="settings-row-desc">Receive OmniOS reminders on the Lock Screen and Notification Center, including while the PWA is closed.</div></div><span class="omni-push-status '+s.cls+'" id="omni-push-status">'+esc(s.label)+'</span></div>'+
    '<div class="settings-row"><div><div class="settings-row-label">Background push</div><div class="settings-row-desc">Syncs only the notification subscription and upcoming reminder title/time to the OmniOS push service. Your main OmniOS database stays local.</div></div><div class="omni-pwa-actions"><button type="button" class="btn btn-sm btn-primary" id="omni-push-enable">'+(enabled?'Resync':'Enable push')+'</button><button type="button" class="btn btn-sm" id="omni-push-test" '+(!enabled?'disabled':'')+'>Test</button>'+(enabled?'<button type="button" class="btn btn-sm" id="omni-push-disable">Disable</button>':'')+'</div></div>'+
    '<div class="settings-row"><div><div class="settings-row-label">Routine reminders</div><div class="settings-row-desc">Schedule notifications for enabled daily, weekly and monthly routines.</div></div><button type="button" class="settings-toggle '+(settings().routineReminders!==false?'on':'')+'" id="omni-routine-push-toggle" role="switch" aria-checked="'+(settings().routineReminders!==false?'true':'false')+'"></button></div>'+
    (iosNeedsInstall()?'<div class="settings-meta-line">On iPhone/iPad, Web Push is available from the Home Screen version of OmniOS. Install the PWA first, open it from the icon, then tap Enable push.</div>':'')+
    '</div>';
}
function renderPushCard(){
  if(currentTab()!=='notifications')return;
  var host=document.getElementById('settings-content');if(!host)return;
  var old=document.getElementById('omnios-push-settings-card');if(old)old.remove();
  var wrap=document.createElement('div');wrap.innerHTML=pushCardHtml();var card=wrap.firstElementChild;host.prepend(card);
  card.querySelector('#omni-push-enable').onclick=async function(){try{if(settings().pushEnabled)await syncPush();else await enablePush();renderPushCard()}catch(e){toast(e.message||'Could not enable push');renderPushCard()}};
  card.querySelector('#omni-push-test').onclick=testPush;
  var dis=card.querySelector('#omni-push-disable');if(dis)dis.onclick=disablePush;
  card.querySelector('#omni-routine-push-toggle').onclick=function(){
    settings().routineReminders=!settings().routineReminders;safeSave();queueSync();renderPushCard();
  };
}
function enhanceSettings(){
  injectStyle();
  renderAssetCard();
  renderPushCard();
}
function wrapSettings(){
  var base=window.renderSettings;
  if(typeof base!=='function'){
    try{if(typeof renderSettings==='function')base=renderSettings}catch(_){}
  }
  if(typeof base!=='function'||base.__omniPWA623)return;
  var wrapped=function(){var r=base.apply(this,arguments);setTimeout(enhanceSettings,0);return r};
  wrapped.__omniPWA623=true;window.renderSettings=wrapped;
  try{renderSettings=wrapped}catch(_){}
}
function wrapSave(){
  var base=window.saveState;
  if(typeof base!=='function'){
    try{if(typeof saveState==='function')base=saveState}catch(_){}
  }
  if(typeof base!=='function'||base.__omniPush623)return;
  var wrapped=function(){var r=base.apply(this,arguments);if(settings().pushEnabled)queueSync();return r};
  wrapped.__omniPush623=true;window.saveState=wrapped;
  try{saveState=wrapped}catch(_){}
}
function handleServiceWorkerMessage(event){
  if(event.data&&event.data.type==='OMNIOS_OPEN_VIEW'&&event.data.view&&typeof window.switchView==='function')window.switchView(event.data.view);
}
function legacyNotificationButton(event){
  var b=event.target&&event.target.closest?event.target.closest('#v55-notif-permission,#v55-browser-notif'):null;
  if(!b)return;
  event.preventDefault();event.stopPropagation();
  if(event.stopImmediatePropagation)event.stopImmediatePropagation();
  enablePush().catch(function(error){toast(error&&error.message?error.message:'Could not enable push')});
}
function openHashView(){
  var v='';
  try{v=decodeURIComponent(location.hash.replace(/^#/,''))}catch(_){}
  if(v&&typeof window.switchView==='function')setTimeout(function(){window.switchView(v);history.replaceState(null,'',location.pathname+location.search)},250);
}
function start(){
  applyAppIconLink();injectStyle();wrapSettings();wrapSave();enhanceSettings();
  if('serviceWorker'in navigator)navigator.serviceWorker.addEventListener('message',handleServiceWorkerMessage);
  document.addEventListener('click',legacyNotificationButton,true);
  openHashView();
  if(settings().pushEnabled)setTimeout(syncPush,3500);
}
Object.assign(API,{enablePush:enablePush,disablePush:disablePush,testPush:testPush,sync:syncPush,collectSchedules:collectSchedules,saveAppIcon:saveAppIcon,resetAppIcon:resetAppIcon,saveBootIcon:saveBootIcon,resetBootIcon:resetBootIcon,renderSettings:enhanceSettings});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();