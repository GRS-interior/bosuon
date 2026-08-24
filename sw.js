/* GRS 보수ON — 서비스 워커 (v4)
   - 오프라인 대비 셸 캐시
   - 알림 클릭 시 앱 창을 열고 해당 접수건/채팅방으로 이동 */
const C = 'bosuon-v4';

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(C).then(c =>
      c.addAll(['./', './index.html', './spec.js', './manifest.webmanifest', './icon-192.png', './icon-512.png']).catch(()=>{})
    )
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(r => { const cp = r.clone(); caches.open(C).then(c => c.put('./index.html', cp)); return r; })
        .catch(() => caches.match('./index.html'))
    );
  }
});

/* 알림 클릭 — 이미 열린 앱이 있으면 그 창을 띄우고 이동 메시지를 보낸다 */
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const d = e.notification.data || {};
  e.waitUntil((async () => {
    const list = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of list) {
      if (c.url && c.url.indexOf(self.registration.scope) === 0) {
        try { await c.focus(); } catch (err) {}
        try { c.postMessage({ type: 'noti-click', reqId: d.reqId || null, room: d.room || null }); } catch (err) {}
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(d.url || './');
  })());
});
