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
            className="fixed top-5 right-5 z-[100] w-full max-w-sm p-4 bg-white rounded-lg shadow-2xl border-l-4 border-brand-light animate-fade-in-right"
            role="alert"
        >
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <InfoCircleIcon className="w-6 h-6 text-brand-light" />
                </div>
                <div className="flex-1 mr-3">
                    <p className="text-sm font-semibold text-brand-dark">تنبيه جديد</p>
                    <p className="mt-1 text-sm text-gray-600">{message}</p>
                    <button 
                        onClick={onClick}
                        className="mt-2 text-sm font-medium text-brand-light hover:text-brand-dark"
                    >
                        عرض التفاصيل
                    </button>
                </div>
                <div className="flex-shrink-0">
                    <button 
                        onClick={onClose} 
                        className="p-1 text-gray-400 rounded-md hover:bg-gray-100 hover:text-gray-600"
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
