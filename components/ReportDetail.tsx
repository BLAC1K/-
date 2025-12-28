
import React, { useState, useMemo } from 'react';
import { Report, User, Role } from '../types';
import { useData } from '../context/DataContext';
import TrashIcon from './icons/TrashIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import CommentIcon from './icons/CommentIcon';
import DownloadIcon from './icons/DownloadIcon';
import AIReportAnalysis from './AIReportAnalysis';

interface ReportDetailProps {
    report: Report;
    user: User;
    viewerRole: Role;
    hideMargin?: boolean;
}

const ReportDetail: React.FC<ReportDetailProps> = ({ report: initialReport, user, viewerRole, hideMargin = false }) => {
    const { updateReport, users } = useData();
    const [report, setReport] = useState<Report>(initialReport);
    const [localRating, setLocalRating] = useState<string>((initialReport.rating ?? '').toString());
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [comment, setComment] = useState(report.managerComment || '');
    
    const isManager = viewerRole === Role.MANAGER;

    const manager = useMemo(() => {
        return users.find(u => u.role === Role.MANAGER) || { fullName: 'مسؤول الشعبة' };
    }, [users]);

    const handleTaskDelete = async (taskId: string) => {
        const taskComment = prompt("سبب الحذف:");
        if (taskComment !== null) {
            const updatedTasks = report.tasks.map(task => 
                task.id === taskId ? { ...task, isDeleted: true, managerComment: taskComment } : task
            );
            const updatedReport = { ...report, tasks: updatedTasks };
            setReport(updatedReport);
            await updateReport(updatedReport);
        }
    };
    
    const handleSaveManagerComment = async () => {
        const updatedReport = { ...report, managerComment: comment };
        setReport(updatedReport);
        setIsEditingComment(false);
        await updateReport(updatedReport);
    };

    const handleRatingBlur = async () => {
        let newRating = parseInt(localRating, 10);
        if (isNaN(newRating)) return;
        if (newRating < 0) newRating = 0;
        if (newRating > 100) newRating = 100;
        const updatedReport = { ...report, rating: newRating };
        setReport(updatedReport);
        await updateReport(updatedReport);
    };

    return (
        <div className="p-6 sm:p-8 space-y-8 bg-inherit">
            <div className="grid grid-cols-1 gap-8">
                
                {/* قسم المهام */}
                <section>
                    <h4 className="text-sm font-bold text-brand-dark dark:text-brand-light mb-3 flex items-center border-r-4 border-brand-light pr-2">
                        المهام المنجزة خلال اليوم
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 uppercase font-bold">
                                <tr>
                                    <th className="px-4 py-3 border-l dark:border-gray-600 w-12 text-center">#</th>
                                    <th className="px-4 py-3">تفاصيل المهمة</th>
                                    {isManager && <th className="px-4 py-3 no-print w-20">إجراء</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {report.tasks.map((task, idx) => (
                                    <tr key={task.id} className={task.isDeleted ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                        <td className="px-4 py-3 border-l dark:border-gray-600 text-center font-bold text-gray-400">{idx + 1}</td>
                                        <td className="px-4 py-3">
                                            <p className={task.isDeleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}>{task.text}</p>
                                            {task.isDeleted && task.managerComment && (
                                                <p className="mt-1 text-[10px] text-red-500 font-bold italic">ملاحظة الحذف: {task.managerComment}</p>
                                            )}
                                        </td>
                                        {isManager && (
                                            <td className="px-4 py-3 no-print text-center">
                                                {!task.isDeleted && (
                                                    <button onClick={() => handleTaskDelete(task.id)} className="text-red-400 hover:text-red-600 p-1">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* التفاصيل الإضافية */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">خلاصة الإنجاز الفعلي</h4>
                        <p className="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">{report.accomplished || 'لا يوجد'}</p>
                    </section>
                    <section className="bg-white dark:bg-gray-800 p-5 rounded-2xl border dark:border-gray-700 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 uppercase">المعوقات والملاحظات</h4>
                        <p className="text-sm text-gray-900 dark:text-white leading-relaxed whitespace-pre-wrap">{report.notAccomplished || 'لا توجد'}</p>
                    </section>
                </div>

                {/* هامش المسؤول والتقييم */}
                {!hideMargin && (
                    <section className="print-page-break">
                        <h4 className="text-sm font-bold text-brand-dark dark:text-brand-light mb-3 flex items-center border-r-4 border-brand-light pr-2">
                           هامش مسؤول الشعبة والتوقيع الرسمي
                        </h4>
                        <div className={`p-6 rounded-2xl border-2 ${report.managerComment ? 'bg-green-50/50 border-green-200 dark:border-green-800/30' : 'bg-gray-50 border-dashed border-gray-300 dark:border-gray-700'}`}>
                            {isManager && isEditingComment ? (
                                <div className="no-print">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={3}
                                        className="w-full p-4 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-2xl outline-none focus:ring-2 focus:ring-brand-light"
                                        placeholder="اكتب الهامش هنا..."
                                    />
                                    <div className="flex justify-end mt-4 gap-2">
                                        <button onClick={() => setIsEditingComment(false)} className="px-4 py-2 text-sm text-gray-600">إلغاء</button>
                                        <button onClick={handleSaveManagerComment} className="px-6 py-2 bg-brand-light text-white rounded-xl font-bold">حفظ الهامش</button>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => isManager && setIsEditingComment(true)} className={isManager ? 'cursor-pointer' : ''}>
                                    <p className={`text-sm leading-relaxed whitespace-pre-wrap italic ${!report.managerComment ? 'text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                        {report.managerComment || 'لم يتم إضافة هامش بعد.'}
                                    </p>
                                    
                                    {report.managerComment && (
                                        <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                                            <div className="text-right">
                                                <p className="font-bold text-gray-900 dark:text-white">مسؤول الشعبة</p>
                                                <p className="text-xs text-gray-500">{manager.fullName}</p>
                                            </div>
                                            <div className="w-32 h-16 border-b border-gray-300 flex items-end justify-center text-[10px] text-gray-300 uppercase tracking-widest">
                                                توقيع وختم الشعبة
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* المرفقات */}
                <section className="print-page-break">
                    <h4 className="text-sm font-bold text-gray-500 mb-4 no-print">المرفقات والوثائق</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {report.attachments?.map((file, idx) => (
                            <div key={idx} className="bg-white border rounded-2xl overflow-hidden shadow-sm print-border">
                                {file.type.startsWith('image/') ? (
                                    <img src={file.content} alt={file.name} className="h-32 w-full object-cover" />
                                ) : (
                                    <div className="h-32 w-full bg-gray-50 flex items-center justify-center">
                                        <DocumentTextIcon className="w-10 h-10 text-gray-300" />
                                    </div>
                                )}
                                <div className="p-2 text-[10px] bg-gray-50 border-t">
                                    <p className="truncate font-bold">{file.name}</p>
                                    <p className="text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {isManager && <AIReportAnalysis report={report} />}
            </div>
        </div>
    );
};

export default ReportDetail;
