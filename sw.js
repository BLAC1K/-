const CACHE_NAME = 'daily-tasks-v7'; // تحديث النسخة
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
    ))
  );
  self.clients.claim();
});

// التعامل مع الطلبات والاحتفاظ بنسخة احتياطية للعمل دون إنترنت
self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/'))
    );
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// استقبال إشعارات الـ Push
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'تنبيه', body: 'تحديث جديد في مهامي.' };
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    dir: 'rtl'
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});