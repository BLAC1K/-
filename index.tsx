import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// تعريف متغير عالمي لتخزين طلب التثبيت
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

// التقاط حدث التثبيت وتخزينه عالمياً بمجرد تشغيل التطبيق
window.addEventListener('beforeinstallprompt', (e) => {
  // منع المتصفح من إظهار النافذة التلقائية فوراً لنتمكن من التحكم بها من أزرارنا
  e.preventDefault();
  window.deferredPrompt = e;
  // إرسال حدث مخصص لإعلام المكونات بأن زر التثبيت يمكن أن يعمل الآن بشكل مباشر
  window.dispatchEvent(new CustomEvent('pwa-installable'));
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