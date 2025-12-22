
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { usePWA } from '../context/PWAContext';
import LogoutIcon from './icons/LogoutIcon';
import UserManagement from './UserManagement'; 
import UsersIcon from './icons/UsersIcon';
import NewReportIcon from './icons/NewReportIcon';
import Avatar from './Avatar';
import ReportsView from './ReportsView';
import ProfileManagement from './ProfileManagement';
import UserCircleIcon from './icons/UserCircleIcon';
import MenuIcon from './icons/MenuIcon';
import XMarkIcon from './icons/XMarkIcon';
import ThemeToggle from './ThemeToggle';
import AppLogoIcon from './icons/AppLogoIcon';
import ConfirmModal from './ConfirmModal';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import SentTasksView from './SentTasksView';
import ArrowDownTrayIcon from './icons/ArrowDownTrayIcon';


const ManagerDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, isCloud } = useData();
    const { installable, showInstallPrompt } = usePWA();
    const [activeTab, setActiveTab] = useState('reports');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    if (!currentUser) return null;
    
    const newReportsCount = reports.filter(r => !r.isViewedByManager && r.status === 'submitted').length;

    const pageTitles: { [key: string]: string } = {
        reports: 'التقارير',
        employees: 'إدارة المنتسبين',
        sentTasks: 'المهام المرسلة',
        profile: 'الملف الشخصي'
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'employees': return <UserManagement />;
            case 'sentTasks': return <SentTasksView />;
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
                className={`flex items-center w-full px-3 py-2 text-sm font-medium transition-colors rounded-lg ${isActive ? 'bg-brand-light/10 dark:bg-brand-light/20 text-brand-dark dark:text-gray-100 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                {icon}
                <span className="mr-3">{label}</span>
                {count && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full">{count}</span> : null}
            </button>
        )
    }

    const SidebarContent = () => (
         <div className="flex flex-col h-full">
            <div className="flex items-center justify-center py-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800 shrink-0">
                <AppLogoIcon className="w-7 h-7 text-brand-dark dark:text-gray-100" />
                <h1 className="mr-2 text-base font-bold text-brand-dark dark:text-gray-100">لوحة التحكم</h1>
            </div>
            
            <div className="flex flex-col items-center p-3 border-b bg-gray-50/50 dark:bg-gray-700/20 dark:border-gray-700 shrink-0">
                <Avatar src={currentUser.profilePictureUrl} name={currentUser.fullName} size={40} />
                 <div className="mt-1 text-center">
                    <span className="block font-bold text-sm text-gray-800 dark:text-gray-200">{currentUser.fullName.split(' ').slice(0, 2).join(' ')}</span>
                     <span className={`inline-flex items-center text-[10px] font-medium ${isCloud ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ml-1 ${isCloud ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                        {isCloud ? 'متصل' : 'محلي'}
                    </span>
                </div>
            </div>

            <nav className="flex-grow px-2 py-2 space-y-1 overflow-y-auto custom-scrollbar">
                <NavItem tabName="reports" label="التقارير" icon={<NewReportIcon className="w-5 h-5"/>} count={newReportsCount}/>
                <NavItem tabName="employees" label="إدارة المنتسبين" icon={<UsersIcon className="w-5 h-5"/>} />
                <NavItem tabName="sentTasks" label="المهام المرسلة" icon={<ClipboardDocumentListIcon className="w-5 h-5"/>} />
                <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-5 h-5"/>} />

                {installable && (
                     <button
                        onClick={showInstallPrompt}
                        className="flex items-center w-full px-3 py-2 text-sm font-bold transition-colors rounded-lg text-brand-light bg-brand-light/10 hover:bg-brand-light/20 mt-4 border border-brand-light/30"
                    >
                        <ArrowDownTrayIcon className="w-5 h-5"/>
                        <span className="mr-3">تثبيت التطبيق</span>
                    </button>
                )}
            </nav>
            
            <div className="px-2 py-2 mt-auto border-t dark:border-gray-700 space-y-1 bg-gray-50 dark:bg-gray-800 shrink-0">
                <ThemeToggle />
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center w-full px-3 py-2 text-sm font-medium transition-colors rounded-lg text-gray-600 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                >
                    <LogoutIcon className="w-5 h-5"/>
                    <span className="mr-3">تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-[100dvh] w-full bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
             {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            
            <aside className={`
                fixed inset-y-0 right-0 z-40 w-64 h-full
                bg-white dark:bg-gray-800 shadow-xl border-l dark:border-gray-700 
                transform transition-transform duration-300 ease-in-out 
                ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} 
                md:relative md:translate-x-0
            `}>
                <SidebarContent />
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 md:hidden shrink-0 z-20">
                    <div className="flex items-center">
                        <AppLogoIcon className="w-8 h-8 ml-3 text-brand-dark dark:text-gray-100" />
                        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{pageTitles[activeTab]}</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(p => !p)}>
                        {isSidebarOpen ? <XMarkIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" /> : <MenuIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />}
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="container mx-auto max-w-6xl pb-10">
                        <div className="hidden md:block mb-6">
                             <div className="flex justify-between items-center border-b pb-4 dark:border-gray-700">
                                <h1 className="text-2xl font-bold text-brand-dark dark:text-gray-100">{pageTitles[activeTab]}</h1>
                                <span className={`md:hidden px-2 py-0.5 text-xs rounded-full flex items-center ${isCloud ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                    <span className={`w-2 h-2 rounded-full mr-1.5 ${isCloud ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                    {isCloud ? 'متصل' : 'محلي'}
                                </span>
                            </div>
                        </div>
                        {renderContent()}
                    </div>
                </main>

                <footer className="py-3 text-xs text-center text-gray-500 dark:text-gray-400 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
                    <p>جميع الحقوق محفوظة 2025م</p>
                    <p>حسين كاظم</p>
                </footer>
            </div>
             {showLogoutConfirm && (
                <ConfirmModal
                    title="تأكيد تسجيل الخروج"
                    message="هل أنت متأكد من رغبتك في تسجيل الخروج؟"
                    onConfirm={logout}
                    onCancel={() => setShowLogoutConfirm(false)}
                    confirmText="خروج"
                />
            )}
        </div>
    );
};

export default ManagerDashboard;
