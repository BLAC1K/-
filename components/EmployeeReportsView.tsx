import React, { useState, useMemo } from 'react';
import { User, Report, Role } from '../types';
import { useData } from '../context/DataContext';
import ReportView from './ReportView';
import Avatar from './Avatar';
import PercentageCircle from './StarRating';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface EmployeeReportsViewProps {
    employee: User;
    onViewReport: (report: Report) => void;
    onBack: () => void;
}

const EmployeeReportsView: React.FC<EmployeeReportsViewProps> = ({ employee, onViewReport, onBack }) => {
    const { reports } = useData();
    const [selectedDate, setSelectedDate] = useState('');

    const allReports = useMemo(() => {
        return reports
            .filter(r => r.userId === employee.id)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [reports, employee.id]);
    
    const filteredReports = useMemo(() => {
        return allReports.filter(r => selectedDate ? r.date === selectedDate : true);
    }, [allReports, selectedDate]);

     const { avgRating, monthlyReportsCount, reportsWithComments } = useMemo(() => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        
        const monthlyReports = allReports.filter(r => {
            const reportDate = new Date(r.date);
            return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
        });
        
        const ratings = monthlyReports.map(r => r.rating).filter(r => typeof r === 'number') as number[];
        const avg = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
        const comments = monthlyReports.filter(r => r.managerComment && r.managerComment.trim() !== '').length;

        return { avgRating: avg, monthlyReportsCount: monthlyReports.length, reportsWithComments: comments };
    }, [allReports]);


    return (
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
                 <button 
                    onClick={onBack}
                    className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-dark dark:hover:text-cyan-300 transition-colors"
                >
                    <ArrowRightIcon className="w-5 h-5 ml-2" />
                    العودة إلى قائمة المنتسبين
                </button>
            </div>
             
             {/* Performance & Filters */}
            <div className="mb-6 p-4 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="w-full lg:w-auto">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">تقييم الشهر الحالي ({new Date().toLocaleString('ar-EG', { month: 'long', year: 'numeric' })})</h4>
                        <div className="flex flex-wrap justify-around sm:justify-start gap-4 sm:gap-6 items-center">
                            <div className="flex flex-col items-center">
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">متوسط التقييم</p>
                                <PercentageCircle percentage={avgRating} size={40} strokeWidth={4} />
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                                <p className="font-semibold text-lg">{monthlyReportsCount}</p>
                                <p className="text-xs">تقارير مقدمة</p>
                            </div>
                            <div className="text-sm text-gray-600 dark:text-gray-300 text-center">
                                <p className="font-semibold text-lg">{reportsWithComments}</p>
                                <p className="text-xs">تقارير عليها هوامش</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            aria-label="البحث بالتاريخ"
                        />
                        <button
                            onClick={() => setSelectedDate('')}
                            className="w-full sm:w-auto px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors shrink-0"
                            aria-label="مسح حقل التاريخ"
                        >
                            مسح
                        </button>
                    </div>
                </div>
            </div>

            {/* Reports List */}
            <div className="flex-grow">
                 {filteredReports.length > 0 ? (
                    <div className="space-y-4">
                        {filteredReports.map(report => (
                            <ReportView key={report.id} report={report} user={employee} viewerRole={Role.MANAGER} onClick={() => onViewReport(report)} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg">
                        <p className="text-gray-500 dark:text-gray-400">لا توجد تقارير تطابق معايير البحث.</p>
                    </div>
                )}
            </div>
         </div>
    );
};

export default EmployeeReportsView;