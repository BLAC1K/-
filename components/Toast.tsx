
import React, { useEffect } from 'react';
import InfoCircleIcon from './icons/InfoCircleIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XMarkIcon from './icons/XMarkIcon';

interface ToastProps {
    message: string;
    onClose: () => void;
    onClick: () => void;
    duration?: number;
    type?: 'info' | 'success';
}

const Toast: React.FC<ToastProps> = ({ message, onClose, onClick, duration = 5000, type = 'info' }) => {
    
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => {
            clearTimeout(timer);
        };
    }, [onClose, duration]);

    const isSuccess = type === 'success';

    return (
        <div 
            className={`fixed top-5 right-5 z-[100] w-full max-w-sm p-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-r-4 animate-fade-in-right ${isSuccess ? 'border-green-500' : 'border-brand-light'}`}
            role="alert"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    {isSuccess ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                    ) : (
                        <InfoCircleIcon className="w-6 h-6 text-brand-light" />
                    )}
                </div>
                <div className="flex-1 mr-3">
                    <div className="flex items-center justify-between">
                        <p className={`text-sm font-bold ${isSuccess ? 'text-green-700 dark:text-green-400' : 'text-brand-dark dark:text-gray-100'}`}>
                            {isSuccess ? 'نجاح العملية' : 'تنبيه جديد'}
                        </p>
                    </div>
                    <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 font-medium">{message}</p>
                    {!isSuccess && (
                        <button 
                            onClick={onClick}
                            className="mt-2 text-xs font-bold text-brand-light hover:underline"
                        >
                            عرض التفاصيل
                        </button>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="p-1 text-gray-400 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        aria-label="إغلاق"
                    >
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Toast;
