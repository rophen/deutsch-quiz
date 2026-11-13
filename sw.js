/* Deutsch 阅读台 service worker
   HTML 与数据走 network-first：内容改了就一定拿新的，离线才回缓存。
                  以前是 cache-first，会导致 books.json 永远停在第一次装的版本。 */
const CACHE = "dq-v3";
const CORE = ["./", "index.html", "manifest.json", "data/books.json", "data/quiz.json",
              "icon-180.png", "icon-512.png"];
const NET_FIRST = /\/(data\/|$|index\.html)/;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;

  if (NET_FIRST.test(new URL(req.url).pathname)) {
    e.respondWith(
      fetch(req).then(res => {
        const cp = res.clone();
        caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {});
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("index.html")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const cp = res.clone();
      caches.open(CACHE).then(c => c.put(req, cp)).catch(() => {});
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
