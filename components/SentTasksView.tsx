
import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import Avatar from './Avatar';
import TaskStatusBadge from './TaskStatusBadge';

const SentTasksView: React.FC = () => {
    const { currentUser } = useAuth();
    const { directTasks, users } = useData();

    const sentTasks = useMemo(() => {
        if (!currentUser) return [];
        return directTasks
            .filter(t => t.managerId === currentUser.id)
            .sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
    }, [directTasks, currentUser]);

    const getUserById = (id: string) => users.find(u => u.id === id);

    if (sentTasks.length === 0) {
        return (
            <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <p className="text-gray-500 dark:text-gray-400">لم تقم بإرسال أي مهام بعد.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {sentTasks.map(task => {
                const employee = getUserById(task.employeeId);
                return (
                    <div key={task.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
                        <div className="flex justify-between items-start flex-wrap gap-y-2">
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <Avatar src={employee?.profilePictureUrl} name={employee?.fullName || 'منتسب محذوف'} size={40} />
                                <div>
                                    <p className="font-semibold text-brand-dark dark:text-gray-100">
                                        مرسلة إلى: {employee?.fullName || 'منتسب محذوف'}
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
                                    <p><span className="font-semibold text-red-800 dark:text-red-300">سبب الاعتذار من المنتسب:</span> {task.rejectionReason}</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SentTasksView;
