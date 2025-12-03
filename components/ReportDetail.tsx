
import React, { useState, useMemo } from 'react';
import { Report, User, Role } from '../types';
import { useData } from '../context/DataContext';
import TrashIcon from './icons/TrashIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CommentIcon from './icons/CommentIcon';
import DownloadIcon from './icons/DownloadIcon';
import AIReportAnalysis from './AIReportAnalysis';

// This component will render the detailed content of a report.
// It contains the logic previously in the expanded state of ReportView.

interface ReportDetailProps {
    report: Report;
    user: User;
    viewerRole: Role;
}

const ReportDetail: React.FC<ReportDetailProps> = ({ report: initialReport, user, viewerRole }) => {
    const { updateReport, users } = useData();
    const [report, setReport] = useState<Report>(initialReport); // Local copy for immediate UI feedback
    const [localRating, setLocalRating] = useState<string>((initialReport.rating ?? '').toString());
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [comment, setComment] = useState(report.managerComment || '');
    
    const isManager = viewerRole === Role.MANAGER;

    // Fetch the manager (Division Official) for the signature
    const manager = useMemo(() => {
        return users.find(u => u.role === Role.MANAGER) || { fullName: 'مسؤول الشعبة' };
    }, [users]);

    const handleTaskDelete = async (taskId: string) => {
        const taskComment = prompt("الرجاء إضافة هامش على سبب الحذف:");
        if (taskComment !== null) {
            const updatedTasks = report.tasks.map(task => 
                task.id === taskId ? { ...task, isDeleted: true, managerComment: taskComment } : task
            );
            const updatedReport = { ...report, tasks: updatedTasks };
            setReport(updatedReport); // Optimistic UI update
            await updateReport(updatedReport);
        }
    };
    
    const handleSaveManagerComment = async () => {
        const updatedReport = { ...report, managerComment: comment };
        setReport(updatedReport); // Optimistic UI update
        setIsEditingComment(false);
        await updateReport(updatedReport);
        
        // Notify employee about the new comment
        localStorage.setItem('comment_notification', JSON.stringify({
            userId: report.userId,
            message: `لديك تعليق جديد من المسؤول على تقريرك بتاريخ ${report.date}.`
        }));
    };

    const handleRatingBlur = async () => {
        let newRating = parseInt(localRating, 10);
        if (isNaN(newRating)) {
             const updatedReport = { ...report, rating: undefined };
             if (report.rating !== undefined) {
                setReport(updatedReport);
                await updateReport(updatedReport);
             }
             return;
        }
        
        if (newRating < 0) newRating = 0;
        if (newRating > 100) newRating = 100;
        
        const updatedReport = { ...report, rating: newRating };
        if (report.rating !== newRating) {
           setReport(updatedReport);
           await updateReport(updatedReport);
        }
    };

    return (
        <div className="px-4 py-5 sm:px-6">
            <dl className="report-detail-grid grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">المهام</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                       <ul className="border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 rounded-md">
                            {report.tasks.map(task => (
                                <li key={task.id} className={`flex items-center justify-between p-3 ${task.isDeleted ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                                    <div>
                                        <p className={`${task.isDeleted ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>{task.text}</p>
                                        {task.isDeleted && task.managerComment && (
                                            <p className="mt-1 text-xs text-red-700 dark:text-red-400">
                                                <span className="font-semibold">تهميش:</span> {task.managerComment}
                                            </p>
                                        )}
                                    </div>
                                    {isManager && !task.isDeleted && (
                                        <button onClick={() => handleTaskDelete(task.id)} className="p-1 text-gray-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 no-print">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </dd>
                </div>
                <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">ما تم إنجازه</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{report.accomplished || 'لا يوجد'}</dd>
                </div>
                <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">ما لم يتم إنجازه</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{report.notAccomplished || 'لا يوجد'}</dd>
                </div>
                {isManager && (
                    <div className="sm:col-span-1 no-print">
                        <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">التقييم (سري)</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                            <div className="flex items-center max-w-min space-x-2 space-x-reverse">
                                <input
                                    type="number"
                                    value={localRating}
                                    onChange={(e) => setLocalRating(e.target.value)}
                                    onBlur={handleRatingBlur}
                                    min="0"
                                    max="100"
                                    className="w-20 px-2 py-1 text-center bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm"
                                    aria-label="Report rating"
                                />
                                <span className="font-semibold text-gray-500 dark:text-gray-400">%</span>
                            </div>
                        </dd>
                    </div>
                )}
                 <div className="sm:col-span-2">
                    <dt className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-400">
                       <CommentIcon className="w-4 h-4 ml-1 text-gray-500"/>
                       هامش مسؤول الشعبة
                    </dt>
                    <dd className="mt-1 text-sm">
                        {isManager && isEditingComment ? (
                            <div className="no-print">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                                />
                                <div className="flex justify-end mt-2 space-x-2 space-x-reverse">
                                    <button onClick={() => setIsEditingComment(false)} className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 dark:border-gray-500">إلغاء</button>
                                    <button onClick={handleSaveManagerComment} className="px-3 py-1 text-sm text-white bg-brand-light border border-transparent rounded-md hover:bg-brand-dark">حفظ</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => isManager && setIsEditingComment(true)} 
                                className={`p-3 rounded-md border min-h-[60px] ${
                                    isManager 
                                    ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent hover:border-gray-200 dark:hover:border-gray-600' 
                                    : report.managerComment 
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800' 
                                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700'
                                }`}
                            >
                                <p className={`whitespace-pre-wrap ${!report.managerComment ? 'text-gray-500 dark:text-gray-400 italic' : 'text-gray-900 dark:text-gray-100'}`}>
                                    {report.managerComment || (isManager ? 'لا يوجد هامش. انقر للإضافة.' : 'لا يوجد هامش.')}
                                </p>
                                
                                {/* Signature Block - Visible only when there is a comment and in print or view */}
                                {report.managerComment && (
                                    <div className="mt-4 pt-2 border-t border-gray-300 dark:border-gray-600 text-left">
                                        <p className="font-bold text-gray-800 dark:text-gray-200">مسؤول الشعبة</p>
                                        <p className="text-gray-600 dark:text-gray-400">{manager.fullName}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </dd>
                </div>
                <div className="sm:col-span-2 print-page-break">
                    <dt className="text-sm font-medium text-gray-600 dark:text-gray-400">المرفقات</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                        {report.attachments?.length > 0 ? (
                            <div className="attachments-grid-print grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                                {report.attachments.map((file, idx) => file.content && (
                                    <div key={idx} className="border dark:border-gray-700 rounded-lg overflow-hidden group relative shadow-sm">
                                        <a href={file.content} target="_blank" rel="noopener noreferrer" className="block h-32 w-full">
                                            {file.type.startsWith('image/') ? (
                                                <img src={file.content} alt={file.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center p-2 text-center">
                                                    <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                                                </div>
                                            )}
                                        </a>
                                        <div className="p-2 text-xs bg-gray-100 dark:bg-gray-700 border-t dark:border-gray-600">
                                            <p className="truncate text-gray-700 dark:text-gray-200 font-medium" title={file.name}>{file.name}</p>
                                            <p className="text-gray-500 dark:text-gray-400">{`${(file.size / 1024).toFixed(1)} KB`}</p>
                                        </div>
                                        <div className="absolute top-2 right-2 no-print">
                                            <a 
                                                href={file.content} 
                                                download={file.name}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 dark:bg-gray-800/80 text-brand-dark dark:text-gray-200 rounded-full shadow-md"
                                                title="تحميل"
                                            >
                                                <DownloadIcon className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p>لا توجد مرفقات.</p>}
                    </dd>
                </div>
                
                {isManager && (
                    <AIReportAnalysis report={report} />
                )}
            </dl>
        </div>
    );
};

export default ReportDetail;
