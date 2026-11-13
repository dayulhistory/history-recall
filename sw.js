// 내용을 고쳐 다시 올릴 때는 아래 버전 숫자를 하나 올려 주세요 (v3 → v4).
const CACHE = "history-recall-v3";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const isPage = req.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith("/index.html");
  if (isPage) {
    // 페이지: 인터넷이 되면 항상 서버의 최신본, 안 되면 저장본
    e.respondWith(fetch(req.url, { cache: "no-cache" }).then(res => {
      if (res.ok) { const a = res.clone(), b = res.clone(); caches.open(CACHE).then(c => { c.put("./index.html", a); c.put("./", b); }); }
      return res;
    }).catch(() => caches.match("./index.html").then(r => r || caches.match("./"))));
    return;
  }
  // 아이콘·글꼴 등: 저장본 먼저, 없으면 받아서 저장
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res && (res.ok || res.type === "opaque")) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => hit)));
});
