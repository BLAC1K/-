
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Role } from '../types';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import DownloadIcon from './icons/DownloadIcon';

const WeeklyReportView: React.FC = () => {
    const { users, reports } = useData();
    
    // تحديد تاريخ اليوم وتاريخ بداية الأسبوع (السبت)
    const [selectedDate, setSelectedDate] = useState(() => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    });

    const employees = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);

    // حساب نطاق الأسبوع (من السبت إلى الخميس/الجمعة)
    const weekRange = useMemo(() => {
        const current = new Date(selectedDate);
        // في JavaScript، الأحد هو 0. نريد جعل السبت بداية الأسبوع.
        // إذا كان اليوم الجمعة (5)، نعود للسبت الماضي.
        const day = current.getDay(); 
        // معادلة للعودة لأقرب يوم سبت سابق
        // السبت = 6، الأحد = 0، ... الجمعة = 5
        const diff = current.getDate() - day - 1 + (day === 6 ? 0 : 7); 
        // تعديل بسيط: لنجعل "السبت" هو بداية الأسبوع بشكل ثابت
        // day: Su:0, Mo:1, Tu:2, We:3, Th:4, Fr:5, Sa:6
        // نريد أن يكون السبت هو البداية.
        const dayAdjusted = day === 6 ? 0 : day + 1; // Sat=0, Sun=1...
        
        const firstDay = new Date(current);
        firstDay.setDate(current.getDate() - dayAdjusted); // العودة للسبت
        
        const weekDates: string[] = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(firstDay);
            d.setDate(firstDay.getDate() + i);
            weekDates.push(d.toISOString().split('T')[0]);
        }
        
        return {
            start: weekDates[0],
            end: weekDates[6],
            dates: weekDates
        };
    }, [selectedDate]);

    const weeklyData = useMemo(() => {
        return employees.map((emp, index) => {
            const empReports = reports.filter(r => 
                r.userId === emp.id && 
                r.status === 'submitted' && 
                weekRange.dates.includes(r.date)
            );

            const submittedDates = empReports.map(r => r.date);
            const missingDates = weekRange.dates.filter(d => !submittedDates.includes(d));

            return {
                seq: index + 1,
                id: emp.id,
                name: emp.fullName,
                unit: emp.unit || '---',
                badge: emp.badgeNumber,
                reportsCount: empReports.length,
                submittedDates,
                missingCount: missingDates.length,
                missingDates
            };
        });
    }, [employees, reports, weekRange]);

    const changeWeek = (offset: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + (offset * 7));
        setSelectedDate(date.toISOString().split('T')[0]);
    };
    
    const isFriday = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.getUTCDay() === 5;
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header / Filter */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 no-print">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-brand-dark dark:text-gray-100">الموقف الأسبوعي للتقارير</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            الفترة من <span className="font-bold dir-ltr">{weekRange.start}</span> إلى <span className="font-bold dir-ltr">{weekRange.end}</span>
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 p-2 rounded-xl">
                        <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg shadow-sm transition-all">
                            <ArrowRightIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => setSelectedDate(e.target.value)}
                            className="bg-transparent border-none text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-0 outline-none"
                        />
                        <button onClick={() => changeWeek(1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-lg shadow-sm transition-all">
                            <ChevronLeftIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                        </button>
                    </div>

                    <button 
                        onClick={() => window.print()} 
                        className="flex items-center gap-2 px-5 py-2.5 bg-brand-light text-white rounded-xl font-bold shadow-lg shadow-brand-light/20 hover:bg-brand-dark transition-all"
                    >
                        <DownloadIcon className="w-5 h-5" />
                        <span>طباعة الموقف</span>
                    </button>
                </div>
            </div>

            {/* Printable Table */}
            <div id="printable-area" className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="hidden print:block p-8 border-b-2 border-black mb-4">
                    <div className="text-center">
                        <h1 className="text-xl font-bold mb-2">استمارة الموقف الأسبوعي للتقارير اليومية</h1>
                        <p className="text-sm">للفترة من {weekRange.start} لغاية {weekRange.end}</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-right border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b-2 border-brand-light dark:border-gray-600 text-gray-700 dark:text-gray-200 text-xs md:text-sm">
                                <th className="p-4 text-center w-16 border-l dark:border-gray-700">ت</th>
                                <th className="p-4 w-48 border-l dark:border-gray-700">اسم المنتسب</th>
                                <th className="p-4 w-32 border-l dark:border-gray-700">الوحدة</th>
                                <th className="p-4 w-24 border-l dark:border-gray-700 text-center">الرقم الوظيفي</th>
                                <th className="p-4 border-l dark:border-gray-700">التقارير المرسلة (التاريخ)</th>
                                <th className="p-4 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300">الملاحظات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {weeklyData.map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="p-4 text-center font-bold text-gray-500 border-l dark:border-gray-700">{item.seq}</td>
                                    <td className="p-4 font-bold text-gray-800 dark:text-gray-200 border-l dark:border-gray-700">
                                        {item.name}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600 dark:text-gray-400 border-l dark:border-gray-700">{item.unit}</td>
                                    <td className="p-4 text-center text-sm font-mono text-gray-600 dark:text-gray-400 border-l dark:border-gray-700">{item.badge}</td>
                                    
                                    {/* المرسلة */}
                                    <td className="p-4 border-l dark:border-gray-700">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-green-600 dark:text-green-400 text-xs mb-1">
                                                العدد: {item.reportsCount}
                                            </span>
                                            <div className="flex flex-wrap gap-1">
                                                {item.submittedDates.map(date => {
                                                    const isFri = isFriday(date);
                                                    return (
                                                        <span key={date} className={`px-2 py-0.5 rounded text-[10px] ${
                                                            isFri 
                                                            ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800' 
                                                            : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                                        }`}>
                                                            {date.slice(5)}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </td>

                                    {/* غير المرسلة */}
                                    <td className="p-4 bg-red-50/30 dark:bg-red-900/5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`font-bold text-xs mb-1 ${item.missingCount > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                                                {item.missingCount > 0 ? `لم يرسل: ${item.missingCount} أيام` : 'ملتزم بالكامل'}
                                            </span>
                                            {item.missingCount > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {item.missingDates.map(date => {
                                                        const isFri = isFriday(date);
                                                        return (
                                                            <span key={date} className={`px-2 py-0.5 rounded text-[10px] ${
                                                                isFri
                                                                ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                                            }`}>
                                                                {date.slice(5)}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {weeklyData.length === 0 && (
                    <div className="p-8 text-center text-gray-500">لا يوجد بيانات لعرضها.</div>
                )}
            </div>
        </div>
    );
};

export default WeeklyReportView;
