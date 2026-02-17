
import React, { useState, useMemo } from 'react';
import { User, Report, Role } from '../types';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import ReportView from './ReportView';
import Avatar from './Avatar';
import ArrowRightIcon from './icons/ArrowRightIcon';
import MonthlyEvaluation from './MonthlyEvaluation';
import PaperAirplaneIcon from './icons/PaperAirplaneIcon';
import XCircleIcon from './icons/XCircleIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';


interface SendTaskModalProps {
    employee: User;
    manager: User;
    onClose: () => void;
}

const SendTaskModal: React.FC<SendTaskModalProps> = ({ employee, manager, onClose }) => {
    const [taskContent, setTaskContent] = useState('');
    const [isSending, setIsSending] = useState(false);
    const { addDirectTask } = useData();

    const handleSend = async () => {
        if (!taskContent.trim()) return;
        setIsSending(true);
        await addDirectTask({
            managerId: manager.id,
            employeeId: employee.id,
            content: taskContent,
        });
        
        localStorage.setItem('task_notification', JSON.stringify({
            userId: employee.id,
            message: `لديك مهمة جديدة من ${manager.fullName}.`
        }));
        
        setIsSending(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-start justify-between pb-4 border-b dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-brand-dark dark:text-gray-100">إرسال مهمة جديدة إلى {employee.fullName.split(' ')[0]}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">ستصل المهمة إلى المنتسب في قسم المهام الواردة.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <XCircleIcon className="w-7 h-7" />
                    </button>
                </div>
                <div className="mt-4">
                    <textarea
                        value={taskContent}
                        onChange={(e) => setTaskContent(e.target.value)}
                        rows={5}
                        placeholder={`اكتب نص المهمة الموجهة إلى ${employee.fullName.split(' ')[0]}...`}
                        className="block w-full p-2 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                    />
                </div>
                <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500" disabled={isSending}>إلغاء</button>
                    <button onClick={handleSend} disabled={isSending || !taskContent.trim()} className="flex items-center px-4 py-2 text-white bg-brand-light rounded-md hover:bg-brand-dark disabled:bg-opacity-50 font-bold">
                         <PaperAirplaneIcon className="w-5 h-5 ml-2" />
                        {isSending ? 'جارِ الإرسال...' : 'إرسال المهمة'}
                    </button>
                </div>
            </div>
        </div>
    );
};


interface EmployeeReportsViewProps {
    employee: User;
    onViewReport: (report: Report) => void;
    onBack: () => void;
}

const EmployeeReportsView: React.FC<EmployeeReportsViewProps> = ({ employee, onViewReport, onBack }) => {
    const { reports, markAllReportsAsReadForUser } = useData();
    const { currentUser: manager } = useAuth();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const allReports = useMemo(() => {
        return reports
            .filter(r => r.userId === employee.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports, employee.id]);
    
    const reportsForSelectedMonth = useMemo(() => {
        if (!selectedMonth) return allReports;
        return allReports.filter(r => r.date.startsWith(selectedMonth));
    }, [allReports, selectedMonth]);

    // حساب العداد الكلي لجميع الشهور
    const unreadCountTotal = useMemo(() => {
        return allReports.filter(r => !r.isViewedByManager && r.status === 'submitted').length;
    }, [allReports]);

    // حساب العداد للشهر الحالي المختار فقط
    const unreadCountInCurrentMonth = useMemo(() => {
        return reportsForSelectedMonth.filter(r => !r.isViewedByManager && r.status === 'submitted').length;
    }, [reportsForSelectedMonth]);

    const hasUnreadInOtherMonths = unreadCountTotal > 0 && unreadCountInCurrentMonth === 0;

    const handleMarkAllRead = async () => {
        setIsMarkingRead(true);
        try {
            await markAllReportsAsReadForUser(employee.id);
        } catch (e) {
            console.error(e);
        } finally {
            setIsMarkingRead(false);
        }
    };

    const [year, month] = selectedMonth.split('-');


    return (
         <>
         <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-3xl shadow-inner animate-fade-in border dark:border-gray-800">
             <div className="flex flex-col sm:flex-row items-center justify-between pb-6 mb-6 border-b dark:border-gray-700 gap-4">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <Avatar src={employee.profilePictureUrl} name={employee.fullName} size={64} className="ring-4 ring-brand-light/10" />
                    <div>
                        <h3 className="text-xl md:text-2xl font-bold text-brand-dark dark:text-gray-100 leading-tight">{employee.fullName}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{employee.jobTitle}</p>
                    </div>
                </div>
                 
                 <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button 
                        onClick={onBack}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border dark:border-gray-600 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all active:scale-95"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>رجوع للقائمة</span>
                    </button>
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-brand-accent-green hover:bg-green-700 transition-all rounded-xl shadow-md shadow-green-600/20 active:scale-95"
                    >
                        <PaperAirplaneIcon className="w-5 h-5" />
                        <span>إرسال مهمة</span>
                    </button>
                </div>
            </div>
             
            <div className="mb-8">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                     <div className="flex flex-col w-full sm:w-auto">
                        <label htmlFor="month-selector" className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-2 mr-2">
                            تصفية التقارير حسب الشهر:
                        </label>
                        <input
                            id="month-selector"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand-light outline-none bg-white dark:bg-gray-800 dark:text-gray-200 shadow-sm transition-all"
                            aria-label="اختر الشهر"
                        />
                    </div>
                    
                    {unreadCountTotal > 0 && (
                        <button 
                            onClick={handleMarkAllRead}
                            disabled={isMarkingRead}
                            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-brand-light bg-brand-light/10 hover:bg-brand-light/20 rounded-xl transition-all active:scale-95 border border-brand-light/20 shadow-sm"
                        >
                            <CheckCircleIcon className="w-4 h-4" />
                            {isMarkingRead ? 'جارِ التحديث...' : `تصفير الإشعارات (${unreadCountTotal})`}
                        </button>
                    )}
                </div>

                {hasUnreadInOtherMonths && (
                    <div className="mb-4 p-3 bg-brand-accent-yellow/10 border border-brand-accent-yellow/20 rounded-xl flex items-center gap-3 animate-fade-in no-print">
                        <ExclamationCircleIcon className="w-6 h-6 text-brand-accent-yellow shrink-0" />
                        <p className="text-[11px] font-bold text-brand-dark dark:text-brand-accent-yellow">
                            💡 ملاحظة: يوجد <span className="underline">{unreadCountTotal}</span> تقرير غير مقروء في "أشهر سابقة". يمكنك تغيير الشهر أعلاه لرؤيتها أو الضغط على "تصفير الإشعارات".
                        </p>
                    </div>
                )}
                
                <MonthlyEvaluation 
                    employee={employee}
                    reportsForMonth={reportsForSelectedMonth}
                    year={year}
                    month={month}
                    onViewReport={onViewReport}
                />
            </div>


            <div className="flex items-center justify-between mb-4 px-2">
                <h4 className="font-bold text-lg text-gray-800 dark:text-gray-200">
                    سجل التقارير المختارة
                </h4>
                <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                    {reportsForSelectedMonth.length} تقرير
                </span>
            </div>

            <div className="flex-grow">
                 {reportsForSelectedMonth.length > 0 ? (
                    <div className="space-y-4">
                        {reportsForSelectedMonth.map(report => (
                            <ReportView key={report.id} report={report} user={employee} viewerRole={Role.MANAGER} onClick={() => onViewReport(report)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                        <p className="text-gray-400 text-sm">لا توجد تقارير مسجلة في هذا الشهر.</p>
                    </div>
                )}
            </div>
         </div>
         {isTaskModalOpen && manager && (
            <SendTaskModal
                employee={employee}
                manager={manager}
                onClose={() => setIsTaskModalOpen(false)}
            />
        )}
        </>
    );
};

export default EmployeeReportsView;
