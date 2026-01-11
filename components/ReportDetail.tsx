
import React, { useState, useMemo } from 'react';
import { Report, User, Role, Attachment } from '../types';
import { useData } from '../context/DataContext';
import TrashIcon from './icons/TrashIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import XMarkIcon from './icons/XMarkIcon';
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
    const [isEditingComment, setIsEditingComment] = useState(false);
    const [comment, setComment] = useState(report.managerComment || '');
    const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);
    
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

    return (
        <div className="w-full flex flex-col space-y-8 p-4 sm:p-8 md:p-10 bg-inherit text-right print:!block print:!p-0 print:!space-y-10" dir="rtl">
            
            {/* 1. قسم المهام اليومية - مصمم لعدم الاقتطاع */}
            <section className="w-full block print:!mb-10">
                <div className="flex items-center mb-4 border-r-4 border-brand-light pr-4 no-print-border">
                    <h4 className="text-sm font-bold text-brand-dark dark:text-brand-light uppercase tracking-wide">
                        بيان المهام والنشاطات اليومية المنجزة
                    </h4>
                </div>
                <div className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-hidden print:!border-gray-400 print:!rounded-none">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-600 print:!bg-gray-200">
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 w-12 text-center border-l dark:border-gray-600 print:!text-black">ت</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 text-right print:!text-black">وصف المهمة</th>
                                {isManager && <th className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 w-20 text-center no-print">إجراء</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700 print:divide-gray-400">
                            {report.tasks.map((task, idx) => (
                                <tr key={task.id} className={`${task.isDeleted ? 'bg-red-50/30' : 'hover:bg-gray-50/50'} transition-colors print:!bg-white`}>
                                    <td className="px-4 py-3 text-xs text-center font-bold text-gray-400 border-l dark:border-gray-600 print:!text-black">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <p className={`text-sm leading-relaxed ${task.isDeleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200 print:!text-black'}`}>
                                            {task.text}
                                        </p>
                                        {task.isDeleted && task.managerComment && (
                                            <p className="mt-1 text-[10px] text-red-500 font-bold italic">ملاحظة المسؤول: {task.managerComment}</p>
                                        )}
                                    </td>
                                    {isManager && (
                                        <td className="px-4 py-3 text-center no-print">
                                            {!task.isDeleted && (
                                                <button onClick={() => handleTaskDelete(task.id)} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-lg transition-all">
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

            {/* 2. قسم التفاصيل الإضافية */}
            <div className="flex flex-col md:flex-row gap-6 print:!block print:!space-y-8">
                <section className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border dark:border-gray-700 print:!bg-white print:!border-gray-300 print:!p-4">
                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase border-b dark:border-gray-700 pb-1 print:!text-black print:!border-gray-400">خلاصة الإنجاز العام</h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap print:!text-black">{report.accomplished || 'لا توجد بيانات'}</p>
                </section>
                <section className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-2xl border dark:border-gray-700 print:!bg-white print:!border-gray-300 print:!p-4">
                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase border-b dark:border-gray-700 pb-1 print:!text-black print:!border-gray-400">المعوقات والمقترحات</h4>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap print:!text-black">{report.notAccomplished || 'لا توجد معوقات'}</p>
                </section>
            </div>

            {/* 3. هامش المسؤول */}
            {!hideMargin && (
                <section className="block w-full print:!mt-12">
                    <div className="flex items-center mb-4 border-r-4 border-brand-light pr-4 no-print-border">
                        <h4 className="text-sm font-bold text-brand-dark dark:text-brand-light uppercase">هامش وتوجيهات مسؤول الشعبة</h4>
                    </div>
                    <div className={`p-8 rounded-3xl border-2 ${report.managerComment ? 'bg-green-50/20 border-green-100 dark:border-green-900/10' : 'bg-gray-50 border-dashed border-gray-300 dark:border-gray-700'} print:!bg-white print:!border-gray-400 print:!rounded-xl print:!p-6`}>
                        {isManager && isEditingComment ? (
                            <div className="no-print space-y-4">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    className="w-full p-4 text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-light"
                                    placeholder="اكتب التوجيهات هنا..."
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingComment(false)} className="text-xs text-gray-500 px-3">إلغاء</button>
                                    <button onClick={handleSaveManagerComment} className="px-6 py-2 bg-brand-light text-white rounded-xl font-bold text-xs shadow-md">حفظ التوجيه</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => isManager && setIsEditingComment(true)} className={`${isManager ? 'cursor-pointer' : ''}`}>
                                <p className={`text-sm leading-relaxed whitespace-pre-wrap italic ${!report.managerComment ? 'text-gray-400' : 'text-gray-800 dark:text-gray-100 print:!text-black'}`}>
                                    {report.managerComment || (isManager ? 'انقر لإضافة هامش المسؤول...' : 'لم يتم إضافة توجيهات بعد.')}
                                </p>
                                
                                {report.managerComment && (
                                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end print:!border-gray-400">
                                        <div className="text-right">
                                            <p className="font-bold text-xs text-gray-900 dark:text-white print:!text-black">مسؤول الشعبة</p>
                                            <p className="text-[10px] text-gray-500 print:!text-gray-700">{manager.fullName}</p>
                                        </div>
                                        <div className="hidden print:block text-center opacity-60">
                                            <div className="w-32 border-b-2 border-black h-6 mb-2"></div>
                                            <p className="text-[9px] font-bold">الختم والتوقيع الرسمي</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 4. المرفقات - لا تظهر في الطباعة لضمان جودة المستند النصي، إلا إذا تم طلب ذلك برمجياً */}
            <section className="block w-full print:!mt-10 no-print">
                <h4 className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest border-b dark:border-gray-700 pb-1">المرفقات والوثائق المصاحبة</h4>
                {report.attachments && report.attachments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {report.attachments.map((file, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setPreviewAttachment(file)}
                                className="group relative aspect-square bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md cursor-pointer transition-all"
                            >
                                {file.type.startsWith('image/') ? (
                                    <img src={file.content} alt={file.name} className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center">
                                        <DocumentTextIcon className="w-8 h-8 text-brand-light/40" />
                                        <span className="text-[8px] mt-1 font-bold text-gray-400 uppercase">DOC</span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-400 italic">لا توجد مرفقات.</p>
                )}
            </section>
        </div>
    );
};

export default ReportDetail;
