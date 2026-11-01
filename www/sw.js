const C='solucan-v1';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','fonts/fonts.css',
 'fonts/Rubik-latin-iJWKBXyIfDnIV7nBrXw.woff2','fonts/Rubik-latin-ext-iJWKBXyIfDnIV7nPrXyi0A.woff2',
 'fonts/RubikDirt-latin-DtVmJxC7WLEj1uIXEWAdilss6w.woff2','fonts/RubikDirt-latin-ext-DtVmJxC7WLEj1uIXEWAdilUs6zDX.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
