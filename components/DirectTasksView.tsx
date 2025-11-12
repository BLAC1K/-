import React, { useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { DirectTask } from '../types';
import Avatar from './Avatar';
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

const DirectTasksView: React.FC = () => {
    const { currentUser } = useAuth();
    const { directTasks, users, updateDirectTaskStatus, markDirectTaskAsRead } = useData();

    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return directTasks
            .filter(t => t.employeeId === currentUser.id)
            .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    }, [directTasks, currentUser]);

    useEffect(() => {
        myTasks.forEach(task => {
            if (task.status === 'pending' && !task.isReadByEmployee) {
                markDirectTaskAsRead(task.id);
            }
        });
    }, [myTasks, markDirectTaskAsRead]);

    const getManager = (managerId: string) => users.find(u => u.id === managerId);

    const handleAcknowledge = (taskId: string) => {
        updateDirectTaskStatus(taskId, 'acknowledged');
    };

    const handleReject = (taskId: string) => {
        const reason = prompt('الرجاء ذكر سبب عدم إمكانية تنفيذ المهمة:');
        if (reason && reason.trim() !== '') {
            updateDirectTaskStatus(taskId, 'rejected', reason);
        } else if (reason !== null) { // User didn't cancel prompt
            alert('يجب ذكر السبب.');
        }
    };
    
    if (myTasks.length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400">لا توجد مهام واردة حالياً.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {myTasks.map(task => {
                const manager = getManager(task.managerId);
                return (
                    <div key={task.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border-r-4 border-brand-light">
                        <div className="flex justify-between items-start flex-wrap gap-y-2">
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <Avatar src={manager?.profilePictureUrl} name={manager?.fullName || 'مسؤول'} size={40} />
                                <div>
                                    <p className="font-semibold text-brand-dark dark:text-gray-100">
                                        مرسلة من: {manager?.fullName || 'المسؤول'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(task.sentAt).toLocaleString('ar-EG')}
                                    </p>
                                </div>
                            </div>
                            <TaskStatusBadge status={task.status} />
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{task.content}</p>
                            
                            {task.status === 'rejected' && task.rejectionReason && (
                                <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-md text-sm">
                                    <p><span className="font-semibold text-red-800 dark:text-red-300">سبب الاعتذار:</span> {task.rejectionReason}</p>
                                </div>
                            )}

                            {task.status === 'acknowledged' && task.acknowledgedAt && (
                                 <div className="mt-3 text-right">
                                    <p className="flex items-center justify-end text-xs text-green-700 dark:text-green-400 font-medium">
                                        <CheckCircleIcon className="w-4 h-4 ml-1" />
                                        <span>تم الاطلاع عليه في: {new Date(task.acknowledgedAt).toLocaleString('ar-EG')}</span>
                                    </p>
                                </div>
                            )}

                        </div>
                        {task.status === 'pending' && (
                            <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end items-center space-x-2 space-x-reverse">
                                <button 
                                    onClick={() => handleReject(task.id)}
                                    className="px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-md transition-colors"
                                >
                                    لا أستطيع التنفيذ
                                </button>
                                <button 
                                    onClick={() => handleAcknowledge(task.id)}
                                    className="px-3 py-1.5 text-sm font-semibold text-white bg-brand-accent-green hover:bg-green-700 rounded-md transition-colors"
                                >
                                    تم الاطلاع والعمل بموجبه
                                </button>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DirectTasksView;
