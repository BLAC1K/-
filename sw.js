
const CACHE_NAME = 'daily-tasks-v9'; // نسخة جديدة لإلغاء الكاش القديم المكسور
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Pre-caching assets with relative paths');
      return cache.addAll(ASSETS_TO_CACHE);
    })
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

self.addEventListener('fetch', event => {
  // تجاوز طلبات الـ API الخارجية والـ Realtime
  if (event.request.url.includes('supabase') || event.request.url.includes('google')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('./') || caches.match('index.html');
        }
      });
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'تنبيه', body: 'تحديث جديد في مهامي.' };
  const options = {
    body: data.body,
    icon: 'icon.png',
    badge: 'icon.png',
    vibrate: [200, 100, 200],
    dir: 'rtl',
    data: { url: './' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
