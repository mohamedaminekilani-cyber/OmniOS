const CACHE='omnios-v62.3-runtime-recovery-r2';
const USER_ASSET_CACHE='omnios-user-assets-v1';
const CORE=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./pwa-personalization.js'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    for(const key of await caches.keys()){
      if(key!==CACHE&&key!==USER_ASSET_CACHE)await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

async function userIconResponse(request){
  const userCache=await caches.open(USER_ASSET_CACHE);
  const custom=await userCache.match(request,{ignoreSearch:true});
  if(custom)return custom;
  const fallback=(await caches.match('./icons/icon-192.png'))||(await fetch('./icons/icon-192.png'));
  return fallback;
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;

  if(url.pathname.endsWith('/omnios-user-icon-192.png')){
    event.respondWith(userIconResponse(event.request));
    return;
  }

  event.respondWith((async()=>{
    try{
      const fresh=await fetch(event.request);
      const cache=await caches.open(CACHE);
      cache.put(event.request,fresh.clone());
      return fresh;
    }catch(_){
      return (await caches.match(event.request)) ||
        (event.request.mode==='navigate' ? await caches.match('./index.html') : Response.error());
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
