
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
        return reports.filter(r => r.userId === employeeId && !r.isViewedByManager).length;
    };

    const filteredEmployees = useMemo(() => {
        let employeesToShow = employees;

        // 1. Search term filter
        if (searchTerm) {
            employeesToShow = employeesToShow.filter(employee =>
                employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // 2. Unread filter
        if (showOnlyUnread) {
            employeesToShow = employeesToShow.filter(employee => getUnreadCount(employee.id) > 0);
        }

        // 3. Date range filter
        if (dateFrom || dateTo) {
            const from = dateFrom || '0000-01-01'; // earliest possible date
            const to = dateTo || '9999-12-31';   // latest possible date

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

    if (viewingReport && selectedEmployee) {
        return (
            <div id="printable-report" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md animate-fade-in relative">
                <div className="flex items-center justify-between pb-4 mb-4 border-b dark:border-gray-700">
                     <div className="flex items-center space-x-3 space-x-reverse">
                         <Avatar src={selectedEmployee.profilePictureUrl} name={selectedEmployee.fullName} size={40} />
                         <div>
                            <h3 className="text-lg font-bold text-brand-dark dark:text-gray-100">التقرير رقم {viewingReport.sequenceNumber}: {selectedEmployee.fullName}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">بتاريخ {viewingReport.date}</p>
                         </div>
                    </div>
                    <div className="flex items-center gap-4 no-print">
                         <button
                            onClick={() => setShowDeleteConfirm(true)}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-red-600 hover:bg-red-700"
                            title="حذف التقرير"
                        >
                            <TrashIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">حذف</span>
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-brand-light hover:bg-brand-dark"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span className="hidden sm:inline">حفظ كـ PDF</span>
                        </button>
                        <button
                            onClick={() => setViewingReport(null)}
                            className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-dark dark:hover:text-cyan-300 transition-colors"
                        >
                            <ArrowRightIcon className="w-5 h-5 ml-2" />
                            العودة إلى تقارير {selectedEmployee.fullName.split(' ')[0]}
                        </button>
                    </div>
                </div>
                <ReportDetail report={viewingReport} user={selectedEmployee} viewerRole={Role.MANAGER} />
                
                {showDeleteConfirm && (
                    <ConfirmModal
                        title="حذف التقرير"
                        message="هل أنت متأكد من رغبتك في حذف هذا التقرير نهائياً؟ لا يمكن التراجع عن هذا الإجراء."
                        onConfirm={handleDeleteReport}
                        onCancel={() => setShowDeleteConfirm(false)}
                        confirmText="حذف"
                        confirmButtonClass="bg-red-600 hover:bg-red-700"
                    />
                )}
            </div>
        );
    }

    if (selectedEmployee) {
        return (
            <EmployeeReportsView 
                employee={selectedEmployee}
                onViewReport={handleViewReport}
                onBack={() => setSelectedEmployee(null)}
            />
        );
    }

    const hasFilteredResults = Object.keys(groupedEmployees).some(key => groupedEmployees[key].length > 0);

    return (
        <div className="space-y-6">
            <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow space-y-4">
                <div>
                    <label htmlFor="search-employee" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        البحث باسم المنتسب
                    </label>
                    <div className="mt-1 flex gap-2">
                        <input
                            id="search-employee"
                            type="text"
                            placeholder="اكتب اسمًا..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-light focus:border-brand-light bg-white dark:bg-gray-700 dark:text-gray-200"
                            aria-label="البحث باسم المنتسب"
                        />
                         <button
                            onClick={() => setSearchTerm('')}
                            className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors shrink-0"
                            aria-label="مسح حقل البحث"
                        >
                            مسح
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end pt-4 border-t dark:border-gray-700">
                    <div>
                        <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
                        <input
                            id="date-from"
                            type="date"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-light focus:border-brand-light bg-white dark:bg-gray-700 dark:text-gray-200"
                        />
                    </div>
                    <div>
                        <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
                        <input
                            id="date-to"
                            type="date"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            min={dateFrom}
                            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-brand-light focus:border-brand-light bg-white dark:bg-gray-700 dark:text-gray-200"
                        />
                    </div>
                    <div className="flex items-center pt-6">
                        <input
                            id="unread-only"
                            type="checkbox"
                            checked={showOnlyUnread}
                            onChange={e => setShowOnlyUnread(e.target.checked)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-light focus:ring-brand-light"
                        />
                        <label htmlFor="unread-only" className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                            تقارير غير مقروءة فقط
                        </label>
                    </div>
                     <div>
                        <button
                            onClick={handleResetFilters}
                            className="w-full flex items-center justify-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                        >
                            <ArrowPathIcon className="w-5 h-5 ml-2" />
                            إعادة تعيين
                        </button>
                    </div>
                </div>
            </div>

            {hasFilteredResults ? (
                <div className="space-y-8">
                    {unitOrder.map(unitName => {
                        const employeesInUnit = groupedEmployees[unitName];
                        if (!employeesInUnit || employeesInUnit.length === 0) return null;

                        return (
                            <UnitFolder
                                key={unitName}
                                unitName={unitName}
                                employees={employeesInUnit}
                                getUnreadCount={getUnreadCount}
                                onEmployeeClick={setSelectedEmployee}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p className="text-gray-500 dark:text-gray-400">
                         لا توجد نتائج تطابق معايير البحث أو الفلترة المحددة.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
