import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// تعريف متغير عالمي لتخزين طلب التثبيت
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

// التقاط حدث التثبيت وتخزينه عالمياً فوراً
window.addEventListener('beforeinstallprompt', (e) => {
  // منع النافذة التلقائية للتحكم بها يدوياً عبر الأزرار
  e.preventDefault();
  window.deferredPrompt = e;
  // إعلام التطبيق أن التثبيت المباشر متاح الآن لتحديث الأزرار
  window.dispatchEvent(new CustomEvent('pwa-prompt-ready'));
  console.log('PWA: Native install prompt is ready to be triggered');
});

// تنظيف الطلب بعد نجاح التثبيت وإخفاء الأزرار
window.addEventListener('appinstalled', () => {
  window.deferredPrompt = null;
  window.dispatchEvent(new CustomEvent('pwa-installed-success'));
  console.log('PWA: App was installed successfully');
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