import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Role, User, Report } from '../types';
import Avatar from './Avatar';
import EmployeeReportsView from './EmployeeReportsView';
import ReportDetail from './ReportDetail';
import ArrowRightIcon from './icons/ArrowRightIcon';
import DownloadIcon from './icons/DownloadIcon';
import UnitFolder from './UnitFolder';

const ReportsView: React.FC = () => {
    const { users, reports, markReportAsViewed } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState<User | null>(null);
    const [viewingReport, setViewingReport] = useState<Report | null>(null);

    const employees = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return employees;
        return employees.filter(employee =>
            employee.fullName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [employees, searchTerm]);
    
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

    const getUnreadCount = (employeeId: string): number => {
        return reports.filter(r => r.userId === employeeId && !r.isViewedByManager).length;
    };

    const handleViewReport = (report: Report) => {
        if (!report.isViewedByManager) {
            markReportAsViewed(report.id);
        }
        setViewingReport(report);
    };

    if (viewingReport && selectedEmployee) {
        return (
            <div id="printable-report" className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md animate-fade-in">
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
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white transition-colors rounded-md bg-brand-light hover:bg-brand-dark"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>حفظ كـ PDF</span>
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

    const allUnitKeys = unitOrder;
    const hasAssignedEmployees = Object.keys(groupedEmployees).some(key => groupedEmployees[key].length > 0);

    return (
        <div className="space-y-6">
            <div className="p-4 mb-6 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div className="flex flex-col md:flex-row gap-4">
                    <input
                        type="text"
                        placeholder="ابحث باسم المنتسب..."
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

            {hasAssignedEmployees ? (
                <div className="space-y-8">
                    {allUnitKeys.map(unitName => {
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
                         {searchTerm
                            ? 'لا يوجد منتسبون معينون لوحدة يطابقون البحث.'
                            : 'لا يوجد منتسبون معينون في أي وحدة حالياً.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ReportsView;
