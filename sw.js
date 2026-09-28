const SHELL_CACHE='pim-fre-shell-v1';
const SHELL=['./','./index.html'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(cache=>cache.addAll(SHELL))
      .then(()=>self.skipWaiting())
      .catch(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(k=>k.startsWith('pim-fre-shell-')&&k!==SHELL_CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(response=>{
          if(response && response.ok){
            const copy=response.clone();
            caches.open(SHELL_CACHE).then(cache=>cache.put('./index.html',copy)).catch(()=>{});
          }
          return response;
        })
        .catch(async()=>{
          return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
        })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(SHELL_CACHE).then(cache=>cache.put(req,copy)).catch(()=>{});
        }
        return response;
      }).catch(()=>cached);
      return cached || network;
    })
  );
});