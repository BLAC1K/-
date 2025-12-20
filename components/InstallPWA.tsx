import React, { useState, useEffect } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import AppLogoIcon from './icons/AppLogoIcon';
import ShareIcon from './icons/ShareIcon';
import PlusIcon from './icons/PlusIcon';
import MenuIcon from './icons/MenuIcon';
import InstallIcon from './icons/InstallIcon';

const InstallPWA: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('android');

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isStandalone) return;

        if (isIos) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }

        // الاستماع لحدث فتح التعليمات يدوياً فقط
        const handleManualOpen = () => setIsVisible(true);
        window.addEventListener('open-install-instructions', handleManualOpen);

        // لمستخدمي آيفون فقط: إظهار تذكير خفيف بعد فترة
        if (isIos) {
            const timer = setTimeout(() => setIsVisible(true), 10000);
            return () => clearTimeout(timer);
        }

        return () => {
            window.removeEventListener('open-install-instructions', handleManualOpen);
        };
    }, []);

    const handleInstallDirectly = async () => {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                window.deferredPrompt = null;
                setIsVisible(false);
            }
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in no-print">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-[32px] sm:rounded-[32px] shadow-2xl p-6 relative animate-fade-in-up border border-gray-100 dark:border-gray-800">
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-full transition-colors"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-16 h-16 bg-brand-light/10 rounded-2xl flex items-center justify-center mb-4 ring-4 ring-brand-light/5">
                        <AppLogoIcon className="w-12 h-12 text-brand-light" />
                    </div>
                    <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100">تثبيت التطبيق على هاتفك</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">احصل على تجربة أسرع وإشعارات فورية</p>
                </div>

                <div className="space-y-6">
                    {window.deferredPrompt ? (
                        <div className="space-y-4">
                            <button 
                                onClick={handleInstallDirectly}
                                className="w-full py-4 bg-brand-light text-white rounded-2xl font-bold text-lg hover:bg-brand-dark transition-all shadow-xl shadow-brand-light/20 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <InstallIcon className="w-6 h-6" />
                                تثبيت الآن بنقرة واحدة
                            </button>
                        </div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
                            <p className="text-sm font-bold text-brand-dark dark:text-brand-accent-yellow mb-2">اتبع الخطوات التالية:</p>
                            {platform === 'ios' ? (
                                <div className="space-y-4 text-right">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-brand-light text-white flex items-center justify-center text-xs shrink-0">1</span>
                                        اضغط على أيقونة <ShareIcon className="w-5 h-5 text-blue-500 inline mx-1" /> "مشاركة"
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-brand-light text-white flex items-center justify-center text-xs shrink-0">2</span>
                                        اختر "إضافة إلى الشاشة الرئيسية"
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 text-right">
                                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-brand-light text-white flex items-center justify-center text-xs shrink-0">1</span>
                                        اضغط على نقاط القائمة <MenuIcon className="w-5 h-5 inline mx-1" />
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-full bg-brand-light text-white flex items-center justify-center text-xs shrink-0">2</span>
                                        اختر "تثبيت التطبيق" أو "إضافة للشاشة"
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t dark:border-gray-800">
                    <button onClick={() => setIsVisible(false)} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600">إغلاق</button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;