
import React from 'react';
import { DirectTask } from '../types';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';

const TaskStatusBadge: React.FC<{ status: DirectTask['status'] }> = ({ status }) => {
    const statusInfo = {
        pending: { text: 'بانتظار الاطلاع', color: 'yellow', icon: <ExclamationCircleIcon className="w-4 h-4 ml-1" /> },
        acknowledged: { text: 'تم الاطلاع', color: 'green', icon: <CheckCircleIcon className="w-4 h-4 ml-1" /> },
        rejected: { text: 'تم الاعتذار', color: 'red', icon: <XCircleIcon className="w-4 h-4 ml-1" /> },
    };
    const currentStatus = statusInfo[status];

    const colorClasses = {
        yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        green: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        red: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses[currentStatus.color]}`}>
            {currentStatus.icon}
            {currentStatus.text}
        </span>
    );
};

export default TaskStatusBadge;
