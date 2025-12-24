
const CACHE_NAME = 'daily-tasks-cache-v6';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// معالجة إشعارات Push في الخلفية
self.addEventListener('push', (event) => {
  let data = { title: 'تنبيه جديد', body: 'يوجد تحديث في نظام المهام.' };
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [100, 50, 100],
    data: { url: '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window' }).then((clientList) => {
    for (const client of clientList) { if (client.url === '/' && 'focus' in client) return client.focus(); }
    if (clients.openWindow) return clients.openWindow('/');
  }));
});

self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('supabase') || event.request.url.includes('google')) return;
  event.respondWith(caches.match(event.request).then((cachedResponse) => {
    return cachedResponse || fetch(event.request).then((response) => {
      if (event.request.method === 'GET' && response.status === 200) {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
      }
      return response;
    });
  }));
});
