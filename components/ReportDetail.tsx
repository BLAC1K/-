import React, { useState } from 'react';
import { Report, User, Role } from '../types';
import { useData } from '../context/DataContext';
import TrashIcon from './icons/TrashIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CommentIcon from './icons/CommentIcon';
import DownloadIcon from './icons/DownloadIcon';

// This component will render the detailed content of a report.
// It contains the logic previously in the expanded state of ReportView.

interface ReportDetailProps {
    report: Report;
    user: User;
    viewerRole: Role;
}

const ReportDetail: React.FC<ReportDetailProps> = ({ report: initialReport, user, viewerRole }) => {
    const [report, setReport] = useState<Report>(initialReport);
    const [localRating, setLocalRating] = useState<string>((initialReport.rating ?? '').toString());
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [comment, setComment] = useState(report.managerComment || '');
    const { updateReport } = useData();
    
    const isManager = viewerRole === Role.MANAGER;

    const handleTaskDelete = (taskId: string) => {
        const taskComment = prompt("الرجاء إضافة هامش على سبب الحذف:");
        if (taskComment !== null) {
            const updatedTasks = report.tasks.map(task => 
                task.id === taskId ? { ...task, isDeleted: true, managerComment: taskComment } : task
            );
            const updatedReport = { ...report, tasks: updatedTasks };
            setReport(updatedReport);
            updateReport(updatedReport);
        }
    };
    
    const handleSaveManagerComment = () => {
        const updatedReport = { ...report, managerComment: comment };
        setReport(updatedReport);
        updateReport(updatedReport);
        setIsEditingComment(false);
    };

    const handleRatingBlur = () => {
        let newRating = parseInt(localRating, 10);
        if (isNaN(newRating)) {
             const updatedReport = { ...report, rating: undefined };
             if (report.rating !== undefined) {
                setReport(updatedReport);
                updateReport(updatedReport);
             }
             return;
        }
        
        if (newRating < 0) newRating = 0;
        if (newRating > 100) newRating = 100;
        
        const updatedReport = { ...report, rating: newRating };
        if (report.rating !== newRating) {
           setReport(updatedReport);
           updateReport(updatedReport);
        }
    };

    return (
        <div className="px-4 py-5 sm:px-6">
            <dl className="report-detail-grid grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-600">المهام</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                       <ul className="border border-gray-200 divide-y divide-gray-200 rounded-md">
                            {report.tasks.map(task => (
                                <li key={task.id} className={`flex items-center justify-between p-3 ${task.isDeleted ? 'bg-red-50' : ''}`}>
                                    <div>
                                        <p className={`${task.isDeleted ? 'line-through text-gray-500' : ''}`}>{task.text}</p>
                                        {task.isDeleted && task.managerComment && (
                                            <p className="mt-1 text-xs text-red-700">
                                                <span className="font-semibold">تهميش:</span> {task.managerComment}
                                            </p>
                                        )}
                                    </div>
                                    {isManager && !task.isDeleted && (
                                        <button onClick={() => handleTaskDelete(task.id)} className="p-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-600 no-print">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </dd>
                </div>
                <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-600">ما تم إنجازه</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{report.accomplished || 'لا يوجد'}</dd>
                </div>
                <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-600">ما لم يتم إنجازه</dt>
                    <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{report.notAccomplished || 'لا يوجد'}</dd>
                </div>
                {isManager && (
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-gray-600">التقييم (سري)</dt>
                        <dd className="mt-1 text-sm text-gray-900">
                            <div className="flex items-center max-w-min space-x-2 space-x-reverse">
                                <input
                                    type="number"
                                    value={localRating}
                                    onChange={(e) => setLocalRating(e.target.value)}
                                    onBlur={handleRatingBlur}
                                    min="0"
                                    max="100"
                                    className="w-20 px-2 py-1 text-center bg-white border border-gray-300 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm"
                                    aria-label="Report rating"
                                />
                                <span className="font-semibold text-gray-500">%</span>
                            </div>
                        </dd>
                    </div>
                )}
                 <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-600">وقت الإرسال</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                        {report.signatureTimestamp ? new Date(report.signatureTimestamp).toLocaleString('ar-EG') : 'غير محدد'}
                    </dd>
                </div>
                <div className="sm:col-span-2">
                    <dt className="text-sm font-medium text-gray-600">توقيع المنتسب</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                        {report.signatureImage ? (
                            <img 
                                src={report.signatureImage} 
                                alt="توقيع" 
                                className="h-20 max-w-[250px] object-contain bg-white p-1 border border-gray-300 rounded-md"
                            />
                        ) : 'لا يوجد توقيع.'}
                    </dd>
                </div>
                 <div className="sm:col-span-2">
                    <dt className="flex items-center text-sm font-medium text-gray-600">
                       <CommentIcon className="w-4 h-4 ml-1 text-gray-500"/>
                       هامش المسؤول
                    </dt>
                    <dd className="mt-1 text-sm">
                        {isManager && isEditingComment ? (
                            <div className="no-print">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm"
                                />
                                <div className="flex justify-end mt-2 space-x-2 space-x-reverse">
                                    <button onClick={() => setIsEditingComment(false)} className="px-3 py-1 text-sm text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">إلغاء</button>
                                    <button onClick={handleSaveManagerComment} className="px-3 py-1 text-sm text-white bg-brand-light border border-transparent rounded-md hover:bg-brand-dark">حفظ</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => isManager && setIsEditingComment(true)} 
                                className={`p-3 rounded-md border ${
                                    isManager 
                                    ? 'cursor-pointer hover:bg-gray-50 border-transparent hover:border-gray-200' 
                                    : report.managerComment 
                                        ? 'bg-green-50 border-green-300' 
                                        : 'bg-gray-50 border-gray-200'
                                }`}
                            >
                                <p className={`whitespace-pre-wrap ${!report.managerComment ? 'text-gray-500 italic' : 'text-gray-900'}`}>
                                    {report.managerComment || (isManager ? 'لا يوجد هامش. انقر للإضافة.' : 'لا يوجد هامش.')}
                                </p>
                            </div>
                        )}
                    </dd>
                </div>
                <div className="sm:col-span-2 print-page-break">
                    <dt className="text-sm font-medium text-gray-600">المرفقات</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                        {report.attachments?.length > 0 ? (
                            <div className="attachments-grid-print grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
                                {report.attachments.map((file, idx) => file.content && (
                                    <div key={idx} className="border rounded-lg overflow-hidden group relative shadow-sm">
                                        <a href={file.content} target="_blank" rel="noopener noreferrer" className="block h-32 w-full">
                                            {file.type.startsWith('image/') ? (
                                                <img src={file.content} alt={file.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full bg-gray-50 flex flex-col items-center justify-center p-2 text-center">
                                                    <DocumentTextIcon className="w-12 h-12 text-gray-400" />
                                                </div>
                                            )}
                                        </a>
                                        <div className="p-2 text-xs bg-gray-100 border-t">
                                            <p className="truncate text-gray-700 font-medium" title={file.name}>{file.name}</p>
                                            <p className="text-gray-500">{`${(file.size / 1024).toFixed(1)} KB`}</p>
                                        </div>
                                        <div className="absolute top-2 right-2 no-print">
                                            <a 
                                                href={file.content} 
                                                download={file.name}
                                                className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-white/80 text-brand-dark rounded-full shadow-md"
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
            </dl>
        </div>
    );
};

export default ReportDetail;