
import React, { useState, useEffect } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import AppLogoIcon from './icons/AppLogoIcon';
import ShareIcon from './icons/ShareIcon'; // سأقوم بإضافته لاحقاً
import PlusIcon from './icons/PlusIcon';

const InstallPWA: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [platform, setPlatform] = useState<'ios' | 'android' | 'other'>('other');
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    useEffect(() => {
        // اكتشاف المنصة
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(userAgent);
        const isAndroid = /android/.test(userAgent);
        
        // التحقق مما إذا كان التطبيق مثبت مسبقاً
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

        if (isStandalone) return;

        if (isIos) setPlatform('ios');
        else if (isAndroid) setPlatform('android');

        // التعامل مع أندرويد (Chrome)
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        });

        // لإظهار التلميح في آيفون بعد 3 ثوانٍ من دخول الموقع
        if (isIos) {
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleInstallAndroid = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-fade-in-up no-print">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 max-w-lg mx-auto relative overflow-hidden">
                <button 
                    onClick={() => setIsVisible(false)}
                    className="absolute top-3 left-3 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                    <XMarkIcon className="w-6 h-6" />
                </button>

                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-light/10 rounded-xl flex items-center justify-center shrink-0">
                        <AppLogoIcon className="w-10 h-10 text-brand-light" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">ثبت التطبيق على هاتفك</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">للوصول السريع وتلقي التنبيهات الفورية</p>
                    </div>
                </div>

                <div className="mt-6">
                    {platform === 'ios' ? (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">خطوات التثبيت على آيفون:</p>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="w-6 h-6 rounded-full bg-brand-light text-white flex items-center justify-center text-xs">1</div>
                                    <span>اضغط على زر <span className="font-bold text-brand-dark dark:text-gray-200">مشاركة (Share)</span> في متصفح سفاري</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                    <div className="w-6 h-6 rounded-full bg-brand-light text-white flex items-center justify-center text-xs">2</div>
                                    <span>اختر <span className="font-bold text-brand-dark dark:text-gray-200">"إضافة إلى الشاشة الرئيسية"</span></span>
                                </div>
                            </div>
                            <div className="pt-2 flex justify-center">
                                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-full text-xs text-gray-500">
                                    <ShareIcon className="w-4 h-4" /> زر المشاركة موجود في أسفل الشاشة
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={handleInstallAndroid}
                            className="w-full py-3 bg-brand-light text-white rounded-xl font-bold hover:bg-brand-dark transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <PlusIcon className="w-5 h-5" />
                            تثبيت الآن
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
