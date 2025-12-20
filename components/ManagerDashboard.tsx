
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
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
import InstallIcon from './icons/InstallIcon';
import Toast from './Toast';

const ManagerDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, isCloud } = useData();
    const [activeTab, setActiveTab] = useState('reports');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [toast, setToast] = useState<{message: string} | null>(null);

    useEffect(() => {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setToast({ message: 'تم تثبيت التطبيق بنجاح!' });
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

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
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
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
            <div className="flex items-center justify-center py-6 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                <AppLogoIcon className="w-8 h-8 text-brand-dark dark:text-gray-100" />
                <h1 className="mr-2 text-lg font-bold text-brand-dark dark:text-gray-100">لوحة التحكم</h1>
            </div>
            
            <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
                <NavItem tabName="reports" label="التقارير" icon={<NewReportIcon className="w-5 h-5"/>} count={newReportsCount}/>
                <NavItem tabName="employees" label="إدارة المنتسبين" icon={<UsersIcon className="w-5 h-5"/>} />
                <NavItem tabName="sentTasks" label="المهام المرسلة" icon={<ClipboardDocumentListIcon className="w-5 h-5"/>} />
                <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-5 h-5"/>} />
            </nav>
            
            <div className="p-4 border-t dark:border-gray-700 space-y-2 bg-gray-50 dark:bg-gray-800">
                {deferredPrompt && (
                    <button onClick={handleInstallClick} className="flex items-center w-full px-3 py-2 text-sm font-bold text-brand-light bg-brand-light/10 hover:bg-brand-light/20 rounded-lg transition-colors border border-brand-light/20">
                        <InstallIcon className="w-5 h-5"/>
                        <span className="mr-3">تثبيت التطبيق</span>
                    </button>
                )}
                <ThemeToggle />
                <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <LogoutIcon className="w-5 h-5"/>
                    <span className="mr-3">تسجيل الخروج</span>
                </button>
            </div>
        </div>
    );

    return (
        <div className="h-[100dvh] w-full bg-gray-100 dark:bg-gray-900 flex overflow-hidden">
             {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-64 h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <SidebarContent />
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 md:hidden z-20">
                    <div className="flex items-center">
                        <AppLogoIcon className="w-8 h-8 ml-3 text-brand-dark dark:text-gray-100" />
                        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{pageTitles[activeTab]}</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(p => !p)}>
                        {isSidebarOpen ? <XMarkIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" /> : <MenuIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />}
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                    <div className="container mx-auto max-w-6xl pb-10">
                        {renderContent()}
                    </div>
                </main>
            </div>
             {showLogoutConfirm && <ConfirmModal title="تأكيد الخروج" message="هل تريد حقاً تسجيل الخروج؟" onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} confirmText="خروج" />}
             {toast && <Toast message={toast.message} onClose={() => setToast(null)} onClick={() => setToast(null)} />}
        </div>
    );
};

export default ManagerDashboard;
