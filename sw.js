/* Sổ CSKH: mở được khi mất mạng (lấy bản mới khi có mạng) */
const C="so-cskh-v2";
self.addEventListener("install",e=>{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c=>c.addAll(["/","/config.js","/manifest.json","/icon-192.png"]).catch(()=>{}))); });
self.addEventListener("activate",e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener("fetch",e=>{ const r=e.request; if(r.method!=="GET") return; const u=new URL(r.url); if(u.origin!==location.origin || u.pathname==="/branches.json") return;
  const key = r.mode==="navigate" && !u.pathname.startsWith("/quan-tri") ? "/" : r;
  e.respondWith(fetch(r).then(res=>{ if(res.ok||r.mode==="navigate"){ const cp=res.clone(); caches.open(C).then(c=>c.put(key,cp)); } return res; }).catch(()=>caches.match(key))); });
