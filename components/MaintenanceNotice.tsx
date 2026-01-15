
import React, { useState, useEffect } from 'react';
import XMarkIcon from './icons/XMarkIcon';
import SparklesIcon from './icons/SparklesIcon';
import AppLogoIcon from './icons/AppLogoIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';

interface MaintenanceNoticeProps {
    userName: string;
}

const MaintenanceNotice: React.FC<MaintenanceNoticeProps> = ({ userName }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // التحقق مما إذا كانت الرسالة قد عُرضت بالفعل في هذه الجلسة
        const hasSeenNotice = sessionStorage.getItem('maintenance_notice_seen');
        if (!hasSeenNotice) {
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 1000); // ظهور بعد ثانية من تحميل الواجهة لضمان الانتباه
            return () => clearTimeout(timer);
        }
    }, []);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('maintenance_notice_seen', 'true');
    };

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in no-print">
            <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl p-8 relative animate-scale-in border border-white/10 overflow-hidden">
                {/* خلفية جمالية خفيفة */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-light/10 rounded-full -mr-16 -mt-16 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-brand-accent-yellow/10 rounded-full -ml-12 -mb-12 blur-2xl"></div>

                <button 
                    onClick={handleDismiss}
                    className="absolute top-6 left-6 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 bg-gray-50 dark:bg-gray-800 rounded-full transition-all active:scale-90"
                    aria-label="إغلاق"
                >
                    <XMarkIcon className="w-5 h-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-6">
                        <div className="w-20 h-20 bg-brand-light/10 rounded-3xl flex items-center justify-center ring-4 ring-brand-light/5">
                            <AppLogoIcon className="w-14 h-14" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-brand-accent-yellow p-1.5 rounded-xl shadow-lg border-2 border-white dark:border-gray-900 animate-bounce">
                            <ExclamationCircleIcon className="w-5 h-5 text-brand-dark" />
                        </div>
                    </div>

                    <h3 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">إشعار صيانة وتحديث</h3>
                    
                    <div className="space-y-4 text-gray-600 dark:text-gray-300 leading-relaxed text-right">
                        <p className="font-bold text-brand-light text-lg">أهلاً بك، {userName.split(' ')[0]}</p>
                        
                        <p className="text-sm md:text-base">
                            نود إحاطتكم علماً بأن التطبيق يخضع حالياً لعمليات <span className="text-brand-accent-red font-bold">تحديث شاملة للصيانة</span> وتطوير الخادم لتقديم خدمة أكثر استقراراً.
                        </p>

                        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-2xl border-r-4 border-brand-accent-yellow shadow-sm">
                            <p className="text-sm md:text-base font-bold text-brand-dark dark:text-brand-accent-yellow leading-relaxed">
                                يرجى كتابة تقاريركم في <span className="underline decoration-2">مسودة خارجية</span> لحين اكتمال أعمال الصيانة والتحديث، وذلك لضمان حفظ بياناتكم بشكل آمن.
                            </p>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            شكراً لتفهمكم وتعاونكم الدائم معنا خلال هذه الفترة الانتقالية.
                        </p>
                    </div>

                    <button 
                        onClick={handleDismiss}
                        className="mt-8 w-full py-4 bg-brand-dark dark:bg-brand-light text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all shadow-lg active:scale-95"
                    >
                        فهمت ذلك
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceNotice;
