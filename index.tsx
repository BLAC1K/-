import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// تعريف متغير عالمي لتخزين طلب التثبيت
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

// التقاط حدث التثبيت وتخزينه عالمياً بمجرد توفره
window.addEventListener('beforeinstallprompt', (e) => {
  // منع المتصفح من إظهار النافذة التلقائية المزعجة
  e.preventDefault();
  // تخزين الحدث ليتم استدعاؤه لاحقاً عند ضغط المستخدم على زر التثبيت
  window.deferredPrompt = e;
  // إرسال حدث مخصص لإبلاغ المكونات بأن التثبيت المباشر متاح الآن
  window.dispatchEvent(new CustomEvent('pwa-install-ready'));
  console.log('PWA: Install prompt is captured and ready');
});

// تنظيف المتغير عند نجاح التثبيت
window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed-success'));
  console.log('PWA: App installed successfully');
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);