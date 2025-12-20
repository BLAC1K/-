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
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

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

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        
        // إظهار التعليمات يدوياً عند الحاجة
        const handleManualOpen = () => setIsVisible(true);
        window.addEventListener('open-install-instructions', handleManualOpen);

        // إظهار التنبيه لمستخدمي iOS بعد فترة قصيرة
        if (isIos) {
            const timer = setTimeout(() => setIsVisible(true), 4000);
            return () => clearTimeout(timer);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('open-install-instructions', handleManualOpen);
        };
    }, []);

    const handleInstallDirectly = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setDeferredPrompt(null);
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
                    <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100">ثبت "مهامي" على هاتفك</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">استمتع بتجربة أسرع وتنبيهات فورية للمهام</p>
                </div>

                <div className="space-y-6">
                    {deferredPrompt ? (
                        <div className="space-y-4">
                            <button 
                                onClick={handleInstallDirectly}
                                className="w-full py-4 bg-brand-light text-white rounded-2xl font-bold text-lg hover:bg-brand-dark transition-all shadow-xl shadow-brand-light/20 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <InstallIcon className="w-6 h-6" />
                                تثبيت التطبيق الآن
                            </button>
                            <p className="text-[10px] text-center text-gray-400">يدعم جهازك التثبيت المباشر بنقرة واحدة</p>
                        </div>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4">
                            <p className="text-sm font-bold text-brand-dark dark:text-brand-accent-yellow mb-2">اتبع الخطوات البسيطة التالية:</p>
                            
                            {platform === 'ios' ? (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-light/20 text-brand-light flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 pt-1">
                                            اضغط على أيقونة <span className="inline-flex p-1 bg-white dark:bg-gray-700 rounded-md shadow-sm mx-1"><ShareIcon className="w-4 h-4 text-blue-500" /></span> 
                                            <span className="font-bold">مشاركة</span> في متصفح سفاري.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-light/20 text-brand-light flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 pt-1">
                                            اسحب القائمة للأعلى ثم اختر <span className="font-bold text-brand-dark dark:text-white">"إضافة إلى الشاشة الرئيسية"</span>.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-light/20 text-brand-light flex items-center justify-center shrink-0 font-bold text-sm">3</div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 pt-1">
                                            اضغط على <span className="font-bold text-brand-light">"إضافة"</span> في الزاوية العلوية.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-light/20 text-brand-light flex items-center justify-center shrink-0 font-bold text-sm">1</div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 pt-1">
                                            اضغط على أيقونة القائمة <span className="inline-flex p-1 bg-white dark:bg-gray-700 rounded-md shadow-sm mx-1"><MenuIcon className="w-4 h-4" /></span> 
                                            في زاوية المتصفح.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="w-8 h-8 rounded-full bg-brand-light/20 text-brand-light flex items-center justify-center shrink-0 font-bold text-sm">2</div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 pt-1">
                                            اختر <span className="font-bold text-brand-dark dark:text-white">"تثبيت التطبيق"</span> أو <span className="font-bold">"إضافة إلى الشاشة الرئيسية"</span>.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-6 border-t dark:border-gray-800">
                    <button 
                        onClick={() => setIsVisible(false)}
                        className="w-full py-3 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-700"
                    >
                        سأقوم بذلك لاحقاً
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;