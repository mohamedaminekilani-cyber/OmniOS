const SHELL_CACHE='omnios-shell-v1';
const USER_ASSET_CACHE='omnios-user-assets-v1';
const SNAPSHOT_PREFIX='omnios-app-snapshot-v1-';
const CORE=[
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-180.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-192.png',
  './icons/icon-maskable-512.png',
  './pwa-personalization.js'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil((async()=>{
    const cache=await caches.open(SHELL_CACHE);
    await cache.addAll(CORE);
  })());
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      const keep=key===SHELL_CACHE||key===USER_ASSET_CACHE||key.startsWith(SNAPSHOT_PREFIX);
      if(!keep)await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function userIconResponse(request){
  const userCache=await caches.open(USER_ASSET_CACHE);
  const custom=await userCache.match(request,{ignoreSearch:true});
  if(custom)return custom;
  const shell=await caches.open(SHELL_CACHE);
  return (await shell.match('./icons/icon-192.png'))||(await fetch('./icons/icon-192.png',{cache:'no-cache'}));
}

function isAppPart(url){
  return /\/app-parts\/part-\d{3}\.html$/.test(url.pathname);
}

function canCache(request,response){
  if(!response||!response.ok||response.type==='opaque')return false;
  const type=(response.headers.get('content-type')||'').toLowerCase();
  if(request.mode==='navigate')return type.includes('text/html');
  if(request.destination==='manifest')return type.includes('application/manifest+json')||type.includes('application/json');
  if(request.destination==='script')return type.includes('javascript')||type.includes('text/plain');
  if(request.destination==='image')return type.startsWith('image/');
  return true;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  // App fragments are owned by index.html's validated two-slot snapshot loader.
  // Do not add a second, independent caching layer here.
  if(isAppPart(url))return;

  if(url.pathname.endsWith('/omnios-user-icon-192.png')){
    event.respondWith(userIconResponse(event.request));
    return;
  }

  event.respondWith((async()=>{
    const shell=await caches.open(SHELL_CACHE);
    try{
      const fresh=await fetch(event.request,{cache:'no-cache'});
      if(canCache(event.request,fresh)){
        try{await shell.put(event.request,fresh.clone())}catch(_){}
      }
      return fresh;
    }catch(_){
      const cached=event.request.mode==='navigate'
        ? await shell.match('./index.html')
        : await shell.match(event.request);
      return cached||Response.error();
    }
  })());
});

self.addEventListener('push',event=>{
  let data={};
  try{data=event.data?.json?.()||{}}catch(_){
    try{data={body:event.data?.text?.()||''}}catch(__){}
  }
  const title=data.title||'OmniOS reminder';
  const options={
    body:data.body||'You have something scheduled in OmniOS.',
    icon:'./omnios-user-icon-192.png',
    badge:'./icons/icon-192.png',
    tag:data.tag||'omnios-reminder',
    renotify:false,
    data:{view:data.view||'reminders',url:data.url||''}
  };
  event.waitUntil((async()=>{
    await self.registration.showNotification(title,options);
    try{await self.navigator?.setAppBadge?.(1)}catch(_){}
  })());
});

self.addEventListener('notificationclick',event=>{
  event.notification.close();
  const view=event.notification.data?.view||'';
  const explicitUrl=event.notification.data?.url||'';
  event.waitUntil((async()=>{
    try{await self.navigator?.clearAppBadge?.()}catch(_){}
    const list=await clients.matchAll({type:'window',includeUncontrolled:true});
    for(const client of list){
      if('focus' in client){
        await client.focus();
        if(view)client.postMessage({type:'OMNIOS_OPEN_VIEW',view});
        return;
      }
    }
    const target=explicitUrl||('./index.html'+(view?'#'+encodeURIComponent(view):''));
    await clients.openWindow(target);
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='OMNIOS_SKIP_WAITING')self.skipWaiting();
});
