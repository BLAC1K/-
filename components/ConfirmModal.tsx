
import React from 'react';

interface ConfirmModalProps {
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    confirmButtonClass = 'bg-brand-light hover:bg-brand-dark'
}) => {
    return (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60" 
            onClick={onCancel}
            aria-modal="true"
            role="dialog"
        >
            <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4">{title}</h2>
                <p className="dark:text-gray-200">{message}</p>
                <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                    <button 
                        onClick={onCancel} 
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
                    >
                        {cancelText}
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className={`px-4 py-2 text-white rounded-md ${confirmButtonClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
