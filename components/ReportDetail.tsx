
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
        <div className="p-4 sm:p-8 space-y-8">
            <div className="grid grid-cols-1 gap-6">
                
                {/* قسم المهام - تنسيق جدولي رسمي يمنع التداخل */}
                <section>
                    <h4 className="text-[11px] font-bold text-brand-dark dark:text-brand-light mb-2 flex items-center border-r-2 border-brand-light pr-2">
                        بيان المهام المنجزة
                    </h4>
                    <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 overflow-hidden shadow-sm">
                        <table className="w-full text-[10px] md:text-[11px] text-right">
                            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold border-b dark:border-gray-600">
                                <tr>
                                    <th className="px-3 py-3 w-8 text-center border-l dark:border-gray-600">ت</th>
                                    <th className="px-3 py-3">المهمة</th>
                                    {isManager && <th className="px-3 py-3 no-print w-16 text-center">إجراء</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {report.tasks.map((task, idx) => (
                                    <tr key={task.id} className={task.isDeleted ? 'bg-red-50/50 dark:bg-red-900/10' : ''}>
                                        <td className="px-3 py-3 border-l dark:border-gray-600 text-center text-gray-400 font-bold">{idx + 1}</td>
                                        <td className="px-3 py-3">
                                            <p className={`${task.isDeleted ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'} leading-normal`}>{task.text}</p>
                                            {task.isDeleted && task.managerComment && (
                                                <p className="mt-1 text-[9px] text-red-500 font-bold italic">ملاحظة الحذف: {task.managerComment}</p>
                                            )}
                                        </td>
                                        {isManager && (
                                            <td className="px-3 py-3 no-print text-center">
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

                {/* التفاصيل الإضافية - أحجام خطوط أصغر ومساحة أوفر */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                        <h4 className="text-[9px] font-bold text-gray-400 mb-1 uppercase">خلاصة الإنجاز</h4>
                        <p className="text-[10px] md:text-[11px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{report.accomplished || 'لا توجد ملاحظات'}</p>
                    </section>
                    <section className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700">
                        <h4 className="text-[9px] font-bold text-gray-400 mb-1 uppercase">المعوقات والمقترحات</h4>
                        <p className="text-[10px] md:text-[11px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">{report.notAccomplished || 'لا توجد معوقات'}</p>
                    </section>
                </div>

                {/* هامش المسؤول - رسمي ومختصر كما طُلب */}
                {!hideMargin && (
                    <section className="print-page-break">
                        <h4 className="text-[11px] font-bold text-brand-dark dark:text-brand-light mb-2 flex items-center border-r-2 border-brand-light pr-2">
                           هامش مسؤول الشعبة
                        </h4>
                        <div className={`p-5 rounded-2xl border-2 ${report.managerComment ? 'bg-green-50/20 border-green-200 dark:border-green-800/30' : 'bg-gray-50 border-dashed border-gray-300 dark:border-gray-700'}`}>
                            {isManager && isEditingComment ? (
                                <div className="no-print space-y-3">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={3}
                                        className="w-full p-4 text-xs bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-light"
                                        placeholder="اكتب التوجيهات هنا..."
                                    />
                                    <div className="flex justify-end gap-2">
                                        <button onClick={() => setIsEditingComment(false)} className="text-xs text-gray-500">إلغاء</button>
                                        <button onClick={handleSaveManagerComment} className="px-6 py-1.5 bg-brand-light text-white rounded-lg font-bold text-xs">حفظ التوجيه</button>
                                    </div>
                                </div>
                            ) : (
                                <div onClick={() => isManager && setIsEditingComment(true)} className={isManager ? 'cursor-pointer' : ''}>
                                    <p className={`text-[11px] md:text-[12px] leading-relaxed whitespace-pre-wrap italic ${!report.managerComment ? 'text-gray-400' : 'text-gray-800 dark:text-gray-100'}`}>
                                        {report.managerComment || (isManager ? 'انقر لإضافة هامش المسؤول...' : 'لم يتم إضافة توجيهات بعد.')}
                                    </p>
                                    
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end">
                                        <div className="text-right">
                                            <p className="font-bold text-[11px] text-gray-900 dark:text-white">مسؤول الشعبة</p>
                                            <p className="text-[10px] text-gray-500">{manager.fullName}</p>
                                        </div>
                                        <div className="hidden print:block w-32 border-b border-black h-8 opacity-0">توقيع</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* المرفقات - عرض شبكي منظم مع خاصية المعاينة للمسؤول */}
                <section className="print-page-break">
                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 no-print uppercase">المرفقات والوثائق المصاحبة</h4>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {report.attachments?.map((file, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => setPreviewAttachment(file)}
                                className="group relative bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer"
                            >
                                <div className="aspect-square w-full">
                                    {file.type.startsWith('image/') ? (
                                        <img src={file.content} alt={file.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-gray-50 dark:bg-gray-700 flex flex-col items-center justify-center">
                                            <DocumentTextIcon className="w-8 h-8 text-brand-light/40" />
                                            <span className="text-[8px] mt-1 font-bold text-gray-400">مستند</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-1.5 text-[8px] bg-gray-50/80 dark:bg-gray-800 border-t dark:border-gray-700">
                                    <p className="truncate font-bold dark:text-gray-200">{file.name}</p>
                                </div>
                                {/* طبقة تلميح للمعايئة */}
                                <div className="absolute inset-0 bg-brand-dark/10 opacity-0 group-hover:opacity-100 flex items-center justify-center no-print transition-opacity">
                                    <span className="bg-white/90 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-sm text-brand-dark">عرض</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {isManager && <AIReportAnalysis report={report} />}
            </div>

            {/* نافذة معاينة المرفق (Lightbox) - حصرية للعرض الرقمي */}
            {previewAttachment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 no-print" onClick={() => setPreviewAttachment(null)}>
                    <button onClick={() => setPreviewAttachment(null)} className="absolute top-6 left-6 text-white bg-white/10 p-2 rounded-full hover:bg-white/20">
                        <XMarkIcon className="w-8 h-8" />
                    </button>
                    <div className="max-w-4xl w-full flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
                        {previewAttachment.type.startsWith('image/') ? (
                            <img src={previewAttachment.content} className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-scale-in" alt="معاينة" />
                        ) : (
                            <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl flex flex-col items-center gap-4 animate-scale-in">
                                <DocumentTextIcon className="w-20 h-20 text-brand-light" />
                                <p className="font-bold dark:text-white">{previewAttachment.name}</p>
                                <a href={previewAttachment.content} download={previewAttachment.name} className="flex items-center gap-2 px-6 py-2 bg-brand-light text-white rounded-xl font-bold">
                                    <DownloadIcon className="w-5 h-5" />
                                    تحميل المستند
                                </a>
                            </div>
                        )}
                        <p className="text-white/70 text-sm">{previewAttachment.name}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetail;
