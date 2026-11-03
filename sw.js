/* sw.js — per aprire l'app anche senza rete (metro, aereo).
   Prima prova la rete (così vedi sempre la versione nuova); se non c'è, usa l'ultima copia salvata.
   I dati non passano di qui: stanno in localStorage e si sincronizzano da soli (dati.js). */
const CASSA = "cattura-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  const nostro = u.origin === location.origin || u.host === "cdn.jsdelivr.net" || u.host.endsWith("fonts.googleapis.com") || u.host.endsWith("fonts.gstatic.com");
  if (!nostro) return;   // Supabase e il resto: sempre e solo rete
  e.respondWith(fetch(r).then(risp => {
    if (risp.ok) { const c = risp.clone(); caches.open(CASSA).then(k => k.put(r, c)); }
    return risp;
  }).catch(() => caches.match(r, { ignoreSearch: true }).then(c => c || Response.error())));
});
