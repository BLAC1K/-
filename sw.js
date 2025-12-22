
const CACHE_NAME = 'daily-tasks-v12'; // نسخة جديدة لضمان التحديث
const ASSETS_TO_CACHE = [
  './',
  'index.html',
  'manifest.json',
  'icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('SW: Pre-caching assets');
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

// التعامل الذكي مع الطلبات لدعم وضع الأوفلاين وتحفيز التثبيت
self.addEventListener('fetch', event => {
  // تجاوز طلبات الـ API الخارجية
  if (event.request.url.includes('supabase') || event.request.url.includes('google')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(response => {
        // تخزين الطلبات الجديدة في الكاش اختيارياً
        if (event.request.method === 'GET' && response.status === 200) {
           const responseClone = response.clone();
           caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
        }
        return response;
      });
    }).catch(() => {
      // عرض الصفحة الرئيسية عند انقطاع الإنترنت
      if (event.request.mode === 'navigate') {
        return caches.match('./') || caches.match('index.html');
      }
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
