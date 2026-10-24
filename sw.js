/* Service worker ของสมุดเวท: เก็บไฟล์ไว้ในเครื่องให้เปิดใช้ได้ตอนไม่มีเน็ต
   เมื่อแก้ไขแอปแล้วอัปโหลดใหม่ ให้เปลี่ยนเลขเวอร์ชันของ CACHE ด้านล่าง เครื่องที่ติดตั้งไว้จะได้รับไฟล์ใหม่ */
var CACHE = 'samutwet-v4';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !isFont) return;

  /* หน้าเว็บ: ลองเครือข่ายก่อนเพื่อได้เวอร์ชันล่าสุด ถ้าออฟไลน์ใช้ของที่เก็บไว้ */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put('./index.html', copy); });
        return res;
      }).catch(function () { return caches.match('./index.html'); })
    );
    return;
  }

  /* ไฟล์อื่นและฟอนต์: ใช้ของที่เก็บไว้ก่อน แล้วอัปเดตเบื้องหลัง */
  e.respondWith(
    caches.match(req).then(function (hit) {
      var net = fetch(req).then(function (res) {
        if (res && (res.status === 200 || res.type === 'opaque')) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return hit; });
      return hit || net;
    })
  );
});
