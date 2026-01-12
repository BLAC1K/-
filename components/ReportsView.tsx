
import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Role, User, Report } from '../types';
import Avatar from './Avatar';
import EmployeeReportsView from './EmployeeReportsView';
import ReportDetail from './ReportDetail';
import ArrowRightIcon from './icons/ArrowRightIcon';
import DownloadIcon from './icons/DownloadIcon';
import UnitFolder from './UnitFolder';
import ArrowPathIcon from './icons/ArrowPathIcon';
import TrashIcon from './icons/TrashIcon';
import ConfirmModal from './ConfirmModal';

const ReportsView: React.FC = () => {
    const { users, reports, markReportAsViewed, deleteReport } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
    const [viewingReport, setViewingReport] = useState<Report | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const employees = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);
    
    const getUnreadCount = (employeeId: string): number => {
        return reports.filter(r => r.userId === employeeId && !r.isViewedByManager && r.status === 'submitted').length;
    };

    const filteredEmployees = useMemo(() => {
        let employeesToShow = employees;
        if (searchTerm) {
            employeesToShow = employeesToShow.filter(employee =>
                employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (showOnlyUnread) {
            employeesToShow = employeesToShow.filter(employee => getUnreadCount(employee.id) > 0);
        }
        if (dateFrom || dateTo) {
            const from = dateFrom || '0000-01-01';
            const to = dateTo || '9999-12-31';
            const employeesWithReportsInRange = new Set(
                reports
                    .filter(report => report.date >= from && report.date <= to)
                    .map(report => report.userId)
            );
            employeesToShow = employeesToShow.filter(employee => employeesWithReportsInRange.has(employee.id));
        }
        return employeesToShow;
    }, [employees, reports, searchTerm, showOnlyUnread, dateFrom, dateTo]);
    
    const unitOrder = ['وحدة التمكين الفني', 'وحدة التنسيق الفني'];
    
    const groupedEmployees = useMemo(() => {
        const groups: { [key: string]: User[] } = {
            'وحدة التمكين الفني': [],
            'وحدة التنسيق الفني': [],
        };
        filteredEmployees.forEach(employee => {
            if (employee.unit && (employee.unit === 'وحدة التمكين الفني' || employee.unit === 'وحدة التنسيق الفني')) {
                groups[employee.unit].push(employee);
            }
        });
        return groups;
    }, [filteredEmployees]);


    const handleViewReport = (report: Report) => {
        if (!report.isViewedByManager) {
            markReportAsViewed(report.id);
        }
        setViewingReport(report);
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setDateFrom('');
        setDateTo('');
        setShowOnlyUnread(false);
    };

    const handleDeleteReport = async () => {
        if (viewingReport) {
            await deleteReport(viewingReport.id);
            setShowDeleteConfirm(false);
            setViewingReport(null);
        }
    };

    // 1. حالة عرض تفاصيل تقرير معين
    if (viewingReport && selectedEmployee) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden animate-fade-in border dark:border-gray-700 print:!border-none print:!shadow-none">
                <div className="flex flex-col md:flex-row items-center justify-between p-5 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700 gap-4 no-print">
                     <div className="flex items-center gap-4">
                         <Avatar src={selectedEmployee.profilePictureUrl} name={selectedEmployee.fullName} size={44} />
                         <div>
                            <h3 className="text-sm md:text-base font-bold text-brand-dark dark:text-gray-100 leading-tight">التقرير #{viewingReport.sequenceNumber}: {selectedEmployee.fullName}</h3>
                            <p className="text-[10px] text-gray-500">{viewingReport.date} - {viewingReport.day}</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-light text-white rounded-xl font-bold shadow-md text-xs">
                            <DownloadIcon className="w-4 h-4" />
                            <span>طباعة / حفظ كـ PDF</span>
                        </button>
                        <button onClick={() => setViewingReport(null)} className="p-2 text-gray-400 hover:text-gray-700">
                            <ArrowRightIcon className="w-7 h-7" />
                        </button>
                    </div>
                </div>

                {/* منطقة الطباعة المعزولة - يتم استهدافها في index.html */}
                <div id="printable-area" className="bg-white dark:bg-gray-900 print:!p-0 print:!block print:!h-auto print:!overflow-visible">
                    {/* ترويسة الطباعة الرسمية - تظهر في الورق فقط */}
                    <div className="hidden print:block p-10 border-b-4 border-double border-black mb-10">
                        <div className="flex justify-between items-start">
                            <div className="text-right space-y-1">
                                <h1 className="text-lg font-bold">قسم التنمية والتأهيل الاجتماعي للشباب</h1>
                                <h2 className="text-base font-bold text-gray-700">شعبة الفنون والمسرح</h2>
                                <div className="pt-4 mt-4 border-r-4 border-gray-400 pr-4">
                                    <p className="text-base font-bold">المنتسب: <span className="font-medium">{selectedEmployee.fullName}</span></p>
                                    <p className="text-sm">العنوان الوظيفي: {selectedEmployee.jobTitle}</p>
                                    <p className="text-sm">الرقم الوظيفي: {selectedEmployee.badgeNumber}</p>
                                </div>
                            </div>
                            <div className="text-left space-y-1">
                                <p className="font-bold text-base text-brand-dark">تقرير تسلسلي: {viewingReport.sequenceNumber}</p>
                                <p className="text-sm">التاريخ: {viewingReport.date}</p>
                                <p className="text-sm">اليوم: {viewingReport.day}</p>
                            </div>
                        </div>
                    </div>
                    
                    <ReportDetail report={viewingReport} user={selectedEmployee} viewerRole={Role.MANAGER} />
                </div>
                
                {showDeleteConfirm && (
                    <ConfirmModal
                        title="حذف التقرير"
                        message="سيتم حذف التقرير نهائياً من سجلات المنتسب."
                        onConfirm={handleDeleteReport}
                        onCancel={() => setShowDeleteConfirm(false)}
                        confirmText="تأكيد الحذف"
                        confirmButtonClass="bg-red-600"
                    />
                )}
            </div>
        );
    }

    // 2. حالة عرض قائمة تقارير منتسب معين (الملف الشخصي للمنتسب)
    if (selectedEmployee) {
        return (
            <EmployeeReportsView 
                employee={selectedEmployee} 
                onViewReport={handleViewReport} 
                onBack={() => setSelectedEmployee(null)} 
            />
        );
    }

    // 3. الحالة الافتراضية: عرض مجلدات الوحدات والبحث
    const hasFilteredResults = Object.keys(groupedEmployees).some(key => groupedEmployees[key].length > 0);

    return (
        <div className="space-y-6 animate-fade-in no-print">
            <div className="p-5 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border dark:border-gray-700 space-y-4">
                <div className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs font-bold text-gray-500 mb-1">البحث عن منتسب</label>
                        <input
                            type="text"
                            placeholder="اكتب اسم المنتسب هنا..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-4 py-2 text-sm border dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-brand-light outline-none"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center h-10 px-4 bg-gray-100 dark:bg-gray-700 rounded-xl">
                            <input id="unread-only" type="checkbox" checked={showOnlyUnread} onChange={e => setShowOnlyUnread(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-brand-light" />
                            <label htmlFor="unread-only" className="mr-2 text-xs font-bold text-gray-600 dark:text-gray-300 cursor-pointer">غير مقروءة</label>
                        </div>
                        <button onClick={handleResetFilters} className="h-10 px-4 bg-gray-100 dark:bg-gray-600 rounded-xl text-xs font-bold text-gray-500 flex items-center gap-2 hover:bg-gray-200">
                            <ArrowPathIcon className="w-4 h-4" /> إعادة تعيين
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">من تاريخ</label>
                        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full px-3 py-2 text-xs border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase">إلى تاريخ</label>
                        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} min={dateFrom} className="w-full px-3 py-2 text-xs border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white" />
                    </div>
                </div>
            </div>

            {hasFilteredResults ? (
                <div className="space-y-6">
                    {unitOrder.map(unitName => {
                        const employeesInUnit = groupedEmployees[unitName];
                        if (!employeesInUnit || employeesInUnit.length === 0) return null;
                        return (
                            <UnitFolder 
                                key={unitName} 
                                unitName={unitName} 
                                employees={employeesInUnit} 
                                getUnreadCount={getUnreadCount} 
                                onEmployeeClick={(emp) => setSelectedEmployee(emp)} 
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                    <p className="text-gray-400 text-sm">لا توجد نتائج مطابقة للبحث حالياً.</p>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
