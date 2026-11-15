/* Deutsch 学习台 service worker */
const CACHE = "dq-v26";
const CORE = [
  "./", "index.html", "manifest.json",
  "data/books.json", "data/quiz.json",
  "icon-180.png", "icon-512.png",
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // 音频：只缓存，不预取；命中缓存就离线播
  if (/\/audio\/.*\.m4a$/.test(url.pathname)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {});
      return r;
    })));
    return;
  }
  // HTML 与数据：network-first，断网回缓存
  if (url.pathname.endsWith("/") || url.pathname.endsWith(".html") ||
      url.pathname.endsWith(".json") || url.pathname.endsWith("sw.js")) {
    e.respondWith(fetch(e.request).then(r => {
      const cp = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {});
      return r;
    }).catch(() => caches.match(e.request).then(hit => hit || caches.match("index.html"))));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request)));
});
