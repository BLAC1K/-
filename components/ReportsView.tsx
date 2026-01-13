
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
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden animate-fade-in border dark:border-gray-700 min-h-full flex flex-col">
                <div className="flex flex-col md:flex-row items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 border-b dark:border-gray-700 gap-4 no-print sticky top-0 z-50">
                     <button 
                        onClick={() => setViewingReport(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-brand-dark dark:text-gray-100 rounded-xl shadow-sm border dark:border-gray-600 hover:bg-gray-50 transition-all font-bold active:scale-95"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>العودة للمنتسب</span>
                    </button>

                     <div className="flex items-center gap-4">
                         <Avatar src={selectedEmployee.profilePictureUrl} name={selectedEmployee.fullName} size={40} />
                         <div>
                            <h3 className="text-xs md:text-sm font-bold text-brand-dark dark:text-gray-100 leading-tight">التقرير #{viewingReport.sequenceNumber}: {selectedEmployee.fullName}</h3>
                            <p className="text-[10px] text-gray-500">{viewingReport.date} - {viewingReport.day}</p>
                         </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" title="حذف التقرير">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-brand-light text-white rounded-lg font-bold shadow-md text-xs hover:bg-brand-dark transition-all">
                            <DownloadIcon className="w-4 h-4" />
                            <span>طباعة / PDF</span>
                        </button>
                    </div>
                </div>

                {/* ترويسة الطباعة الرسمية */}
                <div id="printable-area" className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-gray-900">
                    <div className="hidden print:block p-8 border-b-2 border-black mb-6">
                        <div className="flex justify-between items-start">
                            <div className="text-right">
                                <h1 className="text-sm font-bold">قسم التنمية والتأهيل الاجتماعي للشباب</h1>
                                <h2 className="text-xs font-bold text-gray-700">شعبة الفنون والمسرح</h2>
                                <p className="text-[10px] mt-4 font-bold">المنتسب: <span className="font-medium">{selectedEmployee.fullName}</span></p>
                                <p className="text-[9px]">العنوان الوظيفي: {selectedEmployee.jobTitle}</p>
                            </div>
                            <div className="text-left text-[10px]">
                                 <p className="font-bold text-xs">التاريخ: {viewingReport.date}</p>
                                 <p>التسلسل: {viewingReport.sequenceNumber}</p>
                            </div>
                        </div>
                    </div>
                    <ReportDetail report={viewingReport} user={selectedEmployee} viewerRole={Role.MANAGER} />
                </div>
                
                {showDeleteConfirm && (
                    <ConfirmModal
                        title="تأكيد حذف التقرير"
                        message="سيتم حذف التقرير نهائياً من سجلات المنتسب. هل أنت متأكد؟"
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
        <div className="space-y-6 animate-fade-in">
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
