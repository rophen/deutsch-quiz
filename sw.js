/* 自毁 worker：老用户浏览器里装着旧版 PWA 的 Service Worker，
   它会从缓存里直接返回旧页面，跳转页永远看不到。
   这个文件一被拉取就会安装 → 清空全部缓存 → 注销自己 → 让页面走网络（从而命中 index.html 的跳转）。 */

self.addEventListener("install", (e) => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    // 1) 清掉旧版本缓存的所有资源
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch (_) {}

    // 2) 注销自己，让后续请求完全走网络
    try { await self.registration.unregister(); } catch (_) {}

    // 3) 已打开的页面立刻刷一次，好让它们落到跳转页
    try {
      const cs = await self.clients.matchAll({ type: "window" });
      cs.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) {}
  })());
});

// 不做任何离线缓存：一律走网络
self.addEventListener("fetch", () => {});