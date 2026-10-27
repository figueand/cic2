/* Escuela de Verano · modo sin conexión: guarda las páginas la primera vez que se abren */
const CACHE='ev-v26';
const FILES=["./", "assets/app.js", "assets/config.js", "assets/style.css", "docente.html", "juegos/index.html", "juegos/rescate-profe.html", "juegos/ciberdefensa.html", "juegos/profe-runner.html", "juegos/laberinto-bits.html", "juegos/cyber-quest.html", "juegos/trivia-futbol.html", "juegos/profes.js", "juegos/cristian.png", "index.html", "nivel1/clase1.html", "nivel1/clase10.html", "nivel1/clase2.html", "nivel1/clase3.html", "nivel1/clase4.html", "nivel1/clase5.html", "nivel1/clase6.html", "nivel1/clase7.html", "nivel1/clase8.html", "nivel1/clase9.html", "nivel1/index.html", "nivel2/clase1.html", "nivel2/clase10.html", "nivel2/clase2.html", "nivel2/clase3.html", "nivel2/clase4.html", "nivel2/clase5.html", "nivel2/clase6.html", "nivel2/clase7.html", "nivel2/clase8.html", "nivel2/clase9.html", "nivel2/index.html", "nivel3/clase1.html", "nivel3/clase10.html", "nivel3/clase2.html", "nivel3/clase3.html", "nivel3/clase4.html", "nivel3/clase5.html", "nivel3/clase6.html", "nivel3/clase7.html", "nivel3/clase8.html", "nivel3/clase9.html", "nivel3/index.html"];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()).catch(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r,{ignoreSearch:true})));
});
