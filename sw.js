
const CACHE_NAME = 'daily-tasks-v8'; // تحديث النسخة لفرض التحديث عند المستخدمين
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.png'
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

// منطق الجلب ضروري جداً ليكون التطبيق قابل للتثبيت
self.addEventListener('fetch', event => {
  // تجاوز طلبات الـ API والـ Realtime
  if (event.request.url.includes('supabase') || event.request.url.includes('google')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        // لا نقوم بتخزين كل شيء، فقط الملفات الأساسية إذا لزم الأمر
        return networkResponse;
      }).catch(() => {
        // في حالة عدم وجود إنترنت، ارجع للصفحة الرئيسية إذا كان الطلب ملاحة (Navigate)
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});

self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : { title: 'تنبيه', body: 'تحديث جديد في مهامي.' };
  const options = {
    body: data.body,
    icon: '/icon.png',
    badge: '/icon.png',
    vibrate: [200, 100, 200],
    dir: 'rtl',
    data: { url: '/' }
  };
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
