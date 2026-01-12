
import React, { useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Avatar from './Avatar';
import CheckCircleIcon from './icons/CheckCircleIcon';
import TaskStatusBadge from './TaskStatusBadge';

const DirectTasksView: React.FC = () => {
    const { currentUser } = useAuth();
    const { directTasks, users, updateDirectTaskStatus, markDirectTaskAsRead } = useData();

    const myTasks = useMemo(() => {
        if (!currentUser) return [];
        return directTasks
            .filter(t => t.employeeId === currentUser.id)
            .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    }, [directTasks, currentUser]);

    // معالجة القراءة اللحظية: بمجرد الدخول للواجهة، يتم اعتبار المهام المعلقة "مقروءة"
    useEffect(() => {
        const unreadTasks = myTasks.filter(task => !task.isReadByEmployee);
        if (unreadTasks.length > 0) {
            unreadTasks.forEach(task => {
                markDirectTaskAsRead(task.id);
            });
        }
    }, [myTasks, markDirectTaskAsRead]);

    const getManager = (managerId: string) => users.find(u => u.id === managerId);

    const handleAcknowledge = (taskId: string) => {
        updateDirectTaskStatus(taskId, 'acknowledged');
    };

    const handleReject = (taskId: string) => {
        const reason = prompt('سبب الاعتذار:');
        if (reason?.trim()) {
            updateDirectTaskStatus(taskId, 'rejected', reason);
        }
    };
    
    if (myTasks.length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 animate-fade-in">
                <p className="text-gray-500">لا توجد مهام واردة حالياً.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {myTasks.map(task => {
                const manager = getManager(task.managerId);
                return (
                    <div key={task.id} className={`p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border-r-4 ${!task.isReadByEmployee ? 'border-brand-light ring-1 ring-brand-light/20' : 'border-gray-200 dark:border-gray-700'}`}>
                        <div className="flex justify-between items-start gap-2">
                            <div className="flex items-center gap-3">
                                <Avatar src={manager?.profilePictureUrl} name={manager?.fullName || 'مسؤول'} size={40} />
                                <div>
                                    <p className="font-bold text-brand-dark dark:text-gray-100">{manager?.fullName || 'المسؤول'}</p>
                                    <p className="text-[10px] text-gray-500">{new Date(task.sentAt).toLocaleString('ar-EG')}</p>
                                </div>
                            </div>
                            <TaskStatusBadge status={task.status} />
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-gray-700">
                            <p className="text-sm dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{task.content}</p>
                            
                            {task.status === 'rejected' && (
                                <p className="mt-3 text-xs text-red-500 font-bold bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">سبب الاعتذار: {task.rejectionReason}</p>
                            )}

                            {task.status === 'pending' && (
                                <div className="mt-4 flex justify-end gap-2">
                                    <button onClick={() => handleReject(task.id)} className="px-4 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-xl">اعتذار</button>
                                    <button onClick={() => handleAcknowledge(task.id)} className="px-4 py-2 text-xs font-bold text-white bg-brand-accent-green rounded-xl shadow-md">تم الاطلاع والعمل بموجبه</button>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DirectTasksView;
