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
        
        // Notify employee about the new task
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
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
                    <button onClick={handleSend} disabled={isSending || !taskContent.trim()} className="flex items-center px-4 py-2 text-white bg-brand-light rounded-md hover:bg-brand-dark disabled:bg-opacity-50">
                         <PaperAirplaneIcon className="w-5 h-5 ml-2" />
                        {isSending ? 'جارِ الإرسال...' : 'إرسال'}
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
    const { reports } = useData();
    const { currentUser: manager } = useAuth();
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    // Default to current month in YYYY-MM format
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

    const allReports = useMemo(() => {
        return reports
            .filter(r => r.userId === employee.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports, employee.id]);
    
    const reportsForSelectedMonth = useMemo(() => {
        if (!selectedMonth) return allReports; // Show all if no month is selected
        return allReports.filter(r => r.date.startsWith(selectedMonth));
    }, [allReports, selectedMonth]);

    const [year, month] = selectedMonth.split('-');


    return (
         <>
         <div className="bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 rounded-lg shadow-inner animate-fade-in">
             {/* Header */}
             <div className="flex flex-col sm:flex-row items-start justify-between pb-4 mb-4 border-b dark:border-gray-700 gap-3">
                <div className="flex items-center space-x-4 space-x-reverse">
                    <Avatar src={employee.profilePictureUrl} name={employee.fullName} size={56} />
                    <div>
                        <h3 className="text-2xl font-bold text-brand-dark dark:text-gray-100">تقارير: {employee.fullName}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{employee.jobTitle}</p>
                    </div>
                </div>
                 <div className="flex items-center flex-col-reverse sm:flex-row gap-3">
                     <button 
                        onClick={onBack}
                        className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-dark dark:hover:text-cyan-300 transition-colors"
                    >
                        <ArrowRightIcon className="w-5 h-5 ml-2" />
                        العودة إلى قائمة المنتسبين
                    </button>
                    <button
                        onClick={() => setIsTaskModalOpen(true)}
                        className="flex items-center text-sm font-medium text-white bg-brand-accent-green hover:bg-green-700 transition-colors px-3 py-2 rounded-md shadow-sm"
                    >
                        <PaperAirplaneIcon className="w-5 h-5 ml-2" />
                        إرسال مهمة جديدة
                    </button>
                </div>
            </div>
             
             {/* Month selector and Evaluation */}
            <div className="mb-6">
                 <div className="flex justify-start mb-4">
                     <div className="flex flex-col">
                        <label htmlFor="month-selector" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            اختر الشهر للعرض والتقييم
                        </label>
                        <input
                            id="month-selector"
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            aria-label="اختر الشهر"
                        />
                    </div>
                </div>
                
                <MonthlyEvaluation 
                    employee={employee}
                    reportsForMonth={reportsForSelectedMonth}
                    year={year}
                    month={month}
                />
            </div>


            {/* Reports List */}
            <h4 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-4">
                تقارير الشهر المحدد
            </h4>
            <div className="flex-grow">
                 {reportsForSelectedMonth.length > 0 ? (
                    <div className="space-y-4">
                        {reportsForSelectedMonth.map(report => (
                            <ReportView key={report.id} report={report} user={employee} viewerRole={Role.MANAGER} onClick={() => onViewReport(report)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">لا توجد تقارير لهذا الشهر.</p>
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