
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

    // توليد وقت الطباعة الحالي
    const printTime = useMemo(() => new Date().toLocaleString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric'
    }), []);

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
        <div className="w-full flex flex-col space-y-8 p-4 sm:p-8 md:p-10 bg-inherit text-right" dir="rtl">
            
            {/* رأس التقرير الرسمي - يظهر فقط في الطباعة */}
            <header className="hidden print:block w-full border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    {/* الجانب الأيمن: معلومات المنتسب */}
                    <div className="text-right space-y-1">
                        <h1 className="text-sm md:text-base font-bold">قسم التنمية والتأهيل الاجتماعي للشباب</h1>
                        <h2 className="text-xs md:text-sm font-bold text-gray-800">شعبة الفنون والمسرح</h2>
                        <div className="pt-4 space-y-1">
                            <p className="text-[11px] md:text-xs font-bold">اسم المنتسب: <span className="font-medium border-b border-dotted border-black px-2">{user.fullName}</span></p>
                            <p className="text-[10px] md:text-xs font-bold">العنوان الوظيفي: <span className="font-medium border-b border-dotted border-black px-2">{user.jobTitle}</span></p>
                            <p className="text-[10px] md:text-xs font-bold">الوحدة التنظيمية: <span className="font-medium border-b border-dotted border-black px-2">{user.unit || 'غير محدد'}</span></p>
                        </div>
                    </div>

                    {/* الوسط: شعار (تخيلي للطباعة) */}
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center font-bold text-[8px] mb-1">
                            ختم الشعبة
                        </div>
                        <p className="text-[9px] font-bold">تقرير إنجاز يومي</p>
                    </div>

                    {/* الجانب الأيسر: معلومات التقرير */}
                    <div className="text-left space-y-1">
                        <p className="text-[11px] md:text-xs font-bold">التاريخ: <span className="font-medium">{report.date}</span></p>
                        <p className="text-[11px] md:text-xs font-bold">اليوم: <span className="font-medium">{report.day}</span></p>
                        <p className="text-[11px] md:text-xs font-bold">رقم التقرير: <span className="font-medium">#{report.sequenceNumber || 'مسودة'}</span></p>
                        <div className="pt-4">
                            <p className="text-[8px] text-gray-500 italic">وقت الطباعة: {printTime}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* 1. قسم المهام اليومية */}
            <section className="w-full block overflow-hidden">
                <div className="flex items-center mb-3 border-r-4 border-brand-light pr-3 no-print">
                    <h4 className="text-xs md:text-sm font-bold text-brand-dark dark:text-brand-light uppercase tracking-wide">
                        بيان المهام والنشاطات اليومية المنجزة
                    </h4>
                </div>
                <div className="hidden print:block mb-2">
                    <h4 className="text-xs font-bold border-r-4 border-black pr-2">أولاً: المهام والنشاطات المنجزة</h4>
                </div>
                <div className="w-full bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl shadow-sm overflow-x-auto print:border-black print:rounded-none print:shadow-none">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-600 print:bg-gray-100 print:border-black">
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 w-12 text-center border-l dark:border-gray-600 print:border-black print:text-black">ت</th>
                                <th className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 text-right print:text-black">وصف المهمة</th>
                                {isManager && <th className="px-4 py-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 w-20 text-center no-print">إجراء</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y dark:divide-gray-700 print:divide-black">
                            {report.tasks.map((task, idx) => (
                                <tr key={task.id} className={`${task.isDeleted ? 'bg-red-50/30' : 'hover:bg-gray-50/50'} transition-colors print:bg-transparent`}>
                                    <td className="px-4 py-3 text-[11px] text-center font-bold text-gray-400 border-l dark:border-gray-600 print:border-black print:text-black">{idx + 1}</td>
                                    <td className="px-4 py-3">
                                        <p className={`text-[12px] md:text-[13px] leading-relaxed ${task.isDeleted ? 'line-through text-gray-400' : 'text-gray-800 dark:text-gray-200 print:text-black'}`}>
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
            <div className="flex flex-col md:flex-row gap-6">
                <section className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border dark:border-gray-700 print:bg-transparent print:border-black print:rounded-none">
                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase border-b dark:border-gray-700 pb-1 print:text-black print:border-black">ثانياً: خلاصة الإنجاز</h4>
                    <p className="text-[12px] md:text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap print:text-black">{report.accomplished || 'لا توجد بيانات'}</p>
                </section>
                <section className="flex-1 bg-gray-50 dark:bg-gray-800/50 p-5 rounded-2xl border dark:border-gray-700 print:bg-transparent print:border-black print:rounded-none">
                    <h4 className="text-[10px] font-bold text-gray-400 mb-2 uppercase border-b dark:border-gray-700 pb-1 print:text-black print:border-black">ثالثاً: المعوقات والمقترحات</h4>
                    <p className="text-[12px] md:text-[13px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap print:text-black">{report.notAccomplished || 'لا توجد معوقات'}</p>
                </section>
            </div>

            {/* 3. هامش المسؤول */}
            {!hideMargin && (
                <section className="print-page-break block w-full">
                    <div className="flex items-center mb-3 border-r-4 border-brand-light pr-3 no-print">
                        <h4 className="text-xs font-bold text-brand-dark dark:text-brand-light uppercase">هامش وتوجيهات مسؤول الشعبة</h4>
                    </div>
                    <div className="hidden print:block mb-2">
                         <h4 className="text-xs font-bold border-r-4 border-black pr-2">رابعاً: توجيهات وملاحظات مسؤول الشعبة</h4>
                    </div>
                    <div className={`p-6 rounded-3xl border-2 ${report.managerComment ? 'bg-green-50/20 border-green-100 dark:border-green-900/10' : 'bg-gray-50 border-dashed border-gray-300 dark:border-gray-700'} print:border-black print:rounded-none print:bg-transparent print:border-solid`}>
                        {isManager && isEditingComment ? (
                            <div className="no-print space-y-4">
                                <textarea
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={3}
                                    className="w-full p-4 text-xs md:text-sm bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-brand-light"
                                    placeholder="اكتب التوجيهات هنا..."
                                />
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => setIsEditingComment(false)} className="text-xs text-gray-500 px-3">إلغاء</button>
                                    <button onClick={handleSaveManagerComment} className="px-6 py-2 bg-brand-light text-white rounded-xl font-bold text-xs shadow-md">حفظ التوجيه</button>
                                </div>
                            </div>
                        ) : (
                            <div onClick={() => isManager && setIsEditingComment(true)} className={`${isManager ? 'cursor-pointer' : ''}`}>
                                <p className={`text-xs md:text-sm leading-relaxed whitespace-pre-wrap italic ${!report.managerComment ? 'text-gray-400' : 'text-gray-800 dark:text-gray-100 print:text-black'}`}>
                                    {report.managerComment || (isManager ? 'انقر لإضافة هامش المسؤول...' : 'لم يتم إضافة توجيهات بعد.')}
                                </p>
                                
                                {report.managerComment && (
                                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-end print:border-black">
                                        <div className="text-right">
                                            <p className="font-bold text-[11px] text-gray-900 dark:text-white print:text-black">مسؤول الشعبة</p>
                                            <p className="text-[10px] text-gray-500 print:text-black">{manager.fullName}</p>
                                        </div>
                                        <div className="hidden print:block text-center opacity-80">
                                            <div className="w-24 border-b border-black h-8 mb-1"></div>
                                            <p className="text-[9px] font-bold">الختم والتوقيع الرسمي</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* 4. المرفقات */}
            <section className="print-page-break block w-full no-print">
                <h4 className="text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-widest border-b dark:border-gray-700 pb-1">المرفقات والوثائق المصاحبة</h4>
                {report.attachments && report.attachments.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
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
                                <div className="absolute inset-0 bg-brand-dark/10 opacity-0 group-hover:opacity-100 flex items-center justify-center">
                                    <span className="bg-white px-2 py-0.5 rounded text-[9px] font-bold text-brand-dark shadow-sm">عرض</span>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 p-1 bg-black/50 backdrop-blur-sm">
                                    <p className="text-[8px] text-white truncate text-center">{file.name}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-400 italic">لا توجد مرفقات.</p>
                )}
            </section>

            {isManager && <AIReportAnalysis report={report} />}

            {/* نافذة معاينة المرفق */}
            {previewAttachment && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 no-print" onClick={() => setPreviewAttachment(null)}>
                    <button onClick={() => setPreviewAttachment(null)} className="absolute top-6 left-6 text-white/70 hover:text-white bg-white/10 p-2.5 rounded-full transition-all">
                        <XMarkIcon className="w-8 h-8" />
                    </button>
                    <div className="relative max-w-5xl w-full flex flex-col items-center justify-center gap-4" onClick={e => e.stopPropagation()}>
                        {previewAttachment.type.startsWith('image/') ? (
                            <img src={previewAttachment.content} className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl animate-scale-in" alt="معاينة" />
                        ) : (
                            <div className="bg-white dark:bg-gray-800 p-12 rounded-[2.5rem] flex flex-col items-center gap-6 shadow-2xl animate-scale-in text-center">
                                <DocumentTextIcon className="w-20 h-20 text-brand-light" />
                                <div>
                                    <h3 className="text-lg font-bold dark:text-white mb-1">{previewAttachment.name}</h3>
                                    <p className="text-xs text-gray-500 uppercase">ملف مستند</p>
                                </div>
                                <a href={previewAttachment.content} download={previewAttachment.name} className="flex items-center gap-2 px-8 py-3 bg-brand-light text-white rounded-2xl font-bold shadow-lg shadow-brand-light/20 hover:scale-105 transition-all">
                                    <DownloadIcon className="w-5 h-5" />
                                    تحميل المستند للمراجعة
                                </a>
                            </div>
                        )}
                        <p className="text-white/50 text-xs font-medium">{previewAttachment.name}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportDetail;
