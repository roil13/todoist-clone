// Minimal service worker: network-first with an offline shell fallback.
// Paths are relative to the SW location so they work under the GitHub Pages
// basePath (/todoist-clone/) without hardcoding it.
const CACHE = "tasks-shell-v2";
const SHELL = ["./", "./today", "./manifest.webmanifest", "./icons/icon.svg"];
const FALLBACK = new URL("./today", self.location).href;

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Don't cache API or auth traffic.
  if (new URL(request.url).pathname.startsWith("/api")) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(request).then((r) => r ?? caches.match(FALLBACK))),
  );
});
