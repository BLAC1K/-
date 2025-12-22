
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
    const [isPwaReady, setIsPwaReady] = useState(!!window.deferredPrompt);

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

        const handlePromptReady = () => setIsPwaReady(true);
        const handleManualOpen = () => setIsVisible(true);
        const handleInstalled = () => {
            setIsVisible(false);
            setIsPwaReady(false);
        };

        window.addEventListener('pwa-prompt-ready', handlePromptReady);
        window.addEventListener('open-install-instructions', handleManualOpen);
        window.addEventListener('pwa-installed-success', handleInstalled);

        const timer = setTimeout(() => {
            if (!localStorage.getItem('pwa_prompt_dismissed')) {
                setIsVisible(true);
            }
        }, 3000);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('pwa-prompt-ready', handlePromptReady);
            window.removeEventListener('open-install-instructions', handleManualOpen);
            window.removeEventListener('pwa-installed-success', handleInstalled);
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
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in no-print">
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
                    <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100">تثبيت تطبيق "مهامي"</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">قم بتثبيته الآن ليظهر في قائمة تطبيقاتك ويعمل كنافذة مستقلة سريعة.</p>
                </div>

                <div className="space-y-4">
                    {isPwaReady && platform !== 'ios' ? (
                        <button 
                            onClick={handleInstallDirectly}
                            className="w-full py-4 bg-brand-light text-white rounded-2xl font-bold text-lg hover:bg-brand-dark transition-all shadow-xl shadow-brand-light/20 flex items-center justify-center gap-3 active:scale-95 animate-pulse"
                        >
                            <InstallIcon className="w-6 h-6" />
                            تثبيت فوري في قائمة التطبيقات
                        </button>
                    ) : (
                        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-5 space-y-4 border border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-bold text-brand-dark dark:text-brand-accent-yellow text-center">خطوات التثبيت اليدوي (Standalone):</p>
                            
                            {platform === 'ios' ? (
                                <div className="space-y-4 text-right">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0"><ShareIcon className="w-5 h-5" /></div>
                                        <span>اضغط على زر <b>المشاركة (Share)</b> في Safari</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center shrink-0"><PlusIcon className="w-5 h-5" /></div>
                                        <span>اختر <b>"إضافة إلى الشاشة الرئيسية"</b></span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4 text-right">
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0"><MenuIcon className="w-5 h-5" /></div>
                                        <span>اضغط على <b>النقاط الثلاث</b> في المتصفح</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                        <div className="w-8 h-8 rounded-full bg-brand-light/20 text-brand-light flex items-center justify-center shrink-0"><InstallIcon className="w-5 h-5" /></div>
                                        <span>اختر <b>"تثبيت التطبيق"</b> (Install App)</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex flex-col gap-2">
                    <p className="text-[10px] text-center text-gray-400">بمجرد التثبيت، ستجد أيقونة التطبيق بجانب برامجك المفضلة (واتساب، فيسبوك، إلخ).</p>
                </div>
            </div>
        </div>
    );
};

export default InstallPWA;
