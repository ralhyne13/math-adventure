const CACHE_VERSION = "v3"; // ⬅️ change ce numéro à chaque gros déploiement
const CACHE_NAME = `math-adventure-${CACHE_VERSION}`;

self.addEventListener("install", (event) => {
  self.skipWaiting(); // prend la main direct
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll([
        "/",            // navigation
        "/index.html",
        "/manifest.json",
        "/icon-192.png",
        "/icon-512.png"
      ])
    )
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // supprime anciens caches
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
      await self.clients.claim(); // applique aux onglets ouverts
    })()
  );
});

// Navigation (pages) : NETWORK FIRST => évite l’index.html périmé
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin
  if (url.origin !== location.origin) return;

  // HTML navigation => network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put("/index.html", copy));
          return res;
        })
        .catch(() => caches.match("/index.html"))
    );
    return;
  }

  // Assets (js/css/images) => cache-first + update in background
  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => cached);

      return cached || fetchPromise;
    })
  );
});