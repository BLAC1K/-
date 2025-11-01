import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import LogoutIcon from './icons/LogoutIcon';
import { Role, User, Report } from '../types';
import Logo from './icons/Logo';
import UserManagement from './UserManagement'; 
import AnnouncementCenter from './AnnouncementCenter';
import UsersIcon from './icons/UsersIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import NewReportIcon from './icons/NewReportIcon';
import Avatar from './Avatar';
import EmployeeFolder from './EmployeeFolder';
import EmployeeReportsView from './EmployeeReportsView';
import ReportDetail from './ReportDetail';
import ArrowRightIcon from './icons/ArrowRightIcon';
import ProfileManagement from './ProfileManagement';
import UserCircleIcon from './icons/UserCircleIcon';
import MenuIcon from './icons/MenuIcon';
import XMarkIcon from './icons/XMarkIcon';
import DownloadIcon from './icons/DownloadIcon';


const ManagerDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports } = useData();
    const [activeTab, setActiveTab] = useState('reports');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    if (!currentUser) return null;
    
    const newReportsCount = reports.filter(r => !r.isViewedByManager).length;
    
    const ReportsView = () => {
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
                <div id="printable-report" className="bg-white p-4 sm:p-6 rounded-lg shadow-md animate-fade-in">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b">
                         <div className="flex items-center space-x-3 space-x-reverse">
                             <Avatar src={selectedEmployee.profilePictureUrl} name={selectedEmployee.fullName} size={40} />
                             <div>
                                <h3 className="text-lg font-bold text-brand-dark">التقرير رقم {viewingReport.sequenceNumber}: {selectedEmployee.fullName}</h3>
                                <p className="text-sm text-gray-500">بتاريخ {viewingReport.date}</p>
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
                                className="flex items-center text-sm font-medium text-gray-600 hover:text-brand-dark transition-colors"
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

        return (
            <div className="space-y-6">
                <div className="p-4 mb-6 bg-white rounded-lg shadow">
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="ابحث باسم المنتسب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-brand-light focus:border-brand-light"
                            aria-label="البحث باسم المنتسب"
                        />
                         <button
                            onClick={() => setSearchTerm('')}
                            className="px-4 py-2 text-sm text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors shrink-0"
                            aria-label="مسح حقل البحث"
                        >
                            مسح
                        </button>
                    </div>
                </div>

                {filteredEmployees.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {filteredEmployees.map(employee => (
                            <EmployeeFolder
                                key={employee.id}
                                employee={employee}
                                unreadCount={getUnreadCount(employee.id)}
                                onClick={() => setSelectedEmployee(employee)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 bg-white rounded-lg shadow-md">
                        <p className="text-gray-500">لا يوجد منتسبين يطابقون معايير البحث.</p>
                    </div>
                )}
            </div>
        );
    };

    const pageTitles: { [key: string]: string } = {
        reports: 'التقارير',
        employees: 'إدارة المنتسبين',
        announcements: 'التوجيهات',
        profile: 'الملف الشخصي'
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'employees': return <UserManagement />;
            case 'announcements': return <AnnouncementCenter />;
            case 'profile': return <ProfileManagement user={currentUser} />;
            case 'reports':
            default:
                return <ReportsView />;
        }
    };

    const NavItem: React.FC<{tabName: string; label: string; icon: React.ReactNode; count?: number}> = ({tabName, label, icon, count}) => {
        const isActive = activeTab === tabName;
        return (
             <button
                onClick={() => {
                    setActiveTab(tabName);
                    if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                    }
                }}
                className={`flex items-center w-full px-3 py-3 text-md transition-colors rounded-lg ${isActive ? 'bg-brand-light/10 text-brand-dark font-bold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
                {icon}
                <span className="mr-3">{label}</span>
                {count && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full">{count}</span> : null}
            </button>
        )
    }

    const SidebarContent = () => (
         <>
            <div className="flex items-center justify-center p-4 border-b">
                <Logo className="w-10 h-10" />
                <h1 className="mr-2 text-lg font-bold text-brand-dark">لوحة التحكم</h1>
            </div>
            <div className="flex flex-col items-center p-4 mt-4 space-y-2 border-b">
                <Avatar src={currentUser.profilePictureUrl} name={currentUser.fullName} size={64} />
                <span className="font-medium text-gray-700 text-center">مرحباً, {currentUser.fullName.split(' ')[0]}</span>
            </div>
            <nav className="flex-grow px-2 py-4 space-y-1">
                <NavItem tabName="reports" label="التقارير" icon={<NewReportIcon className="w-6 h-6"/>} count={newReportsCount}/>
                <NavItem tabName="employees" label="إدارة المنتسبين" icon={<UsersIcon className="w-6 h-6"/>} />
                <NavItem tabName="announcements" label="التوجيهات" icon={<MegaphoneIcon className="w-6 h-6"/>} />
                <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-6 h-6"/>} />
                <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-3 text-md transition-colors rounded-lg text-gray-600 hover:bg-gray-100"
                >
                    <LogoutIcon className="w-6 h-6"/>
                    <span className="mr-3">تسجيل الخروج</span>
                </button>
            </nav>
        </>
    );

    return (
        <div className="flex min-h-screen bg-gray-100">
             {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            <aside className={`fixed inset-y-0 right-0 z-40 flex flex-col w-64 bg-white shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
                <SidebarContent />
            </aside>
            
            <div className="flex flex-col flex-1 w-full overflow-y-auto md:mr-64">
                <header className="flex items-center justify-between p-4 bg-white shadow-md md:hidden sticky top-0 z-20">
                    <h1 className="text-xl font-bold text-brand-dark">{pageTitles[activeTab]}</h1>
                    <button onClick={() => setIsSidebarOpen(p => !p)}>
                        {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </header>

                <main className="flex-grow w-full max-w-6xl px-4 py-8 mx-auto">
                    <div className="hidden md:block mb-6">
                        <h1 className="text-3xl font-bold text-brand-dark">{pageTitles[activeTab]}</h1>
                    </div>
                    {renderContent()}
                </main>

                <footer className="py-4 mt-auto text-sm text-center text-gray-500 bg-white border-t">
                    <p>تم انشاء التطبيق بواسطة حسين كاظم</p>
                </footer>
            </div>
        </div>
    );
};

export default ManagerDashboard;