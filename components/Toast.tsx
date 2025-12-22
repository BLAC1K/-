import React, { useEffect } from 'react';
import InfoCircleIcon from './icons/InfoCircleIcon';
import XMarkIcon from './icons/XMarkIcon';

interface ToastProps {
    message: string;
    onClose: () => void;
    onClick: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, onClose, onClick, duration = 5000 }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose, duration]);

    return (
        <div 
            className="fixed top-5 right-5 z-[100] w-full max-w-sm p-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-l-4 border-brand-light animate-fade-in-right"
            role="alert"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <InfoCircleIcon className="w-6 h-6 text-brand-light" />
                </div>
                <div className="flex-1 mr-3">
                    <p className="text-sm font-semibold text-brand-dark dark:text-gray-100">تنبيه جديد</p>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{message}</p>
                    <button 
                        onClick={onClick}
                        className="mt-2 text-sm font-medium text-brand-light hover:text-brand-dark dark:hover:text-cyan-300"
                    >
                        عرض التفاصيل
                    </button>
                </div>
                <div className="flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="p-1 text-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-200"
                        aria-label="إغلاق"
                    >
                        <XMarkIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;