
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import LogoutIcon from './icons/LogoutIcon';
import UserManagement from './UserManagement'; 
import UsersIcon from './icons/UsersIcon';
import NewReportIcon from './icons/NewReportIcon';
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
import Toast from './Toast';
import ArrowPathIcon from './icons/ArrowPathIcon';

const ManagerDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, notification, clearNotification, isSyncing, refreshData } = useData();
    const [activeTab, setActiveTab] = useState('reports');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // عداد التقارير غير المقروءة - لحظي تماماً
    const newReportsCount = useMemo(() => 
        reports.filter(r => !r.isViewedByManager && r.status === 'submitted').length
    , [reports]);

    if (!currentUser) return null;

    const NavItem = ({ tab, label, icon, count }: any) => (
        <button
            onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all rounded-xl ${activeTab === tab ? 'bg-brand-light text-white shadow-lg shadow-brand-light/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
            <div className="w-6 h-6">{icon}</div>
            <span className="mr-3">{label}</span>
            {count > 0 && <span className="mr-auto bg-brand-accent-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-bounce">{count}</span>}
        </button>
    );

    return (
        <div className="h-[100dvh] w-full bg-[#f8f9fa] dark:bg-[#121212] flex overflow-hidden">
             {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-72 h-full bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-700">
                    <div className="p-6 border-b dark:border-gray-700 flex flex-col items-center gap-2">
                        <AppLogoIcon className="w-10 h-10" />
                        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">لوحة التحكم</h1>
                        <button onClick={refreshData} className="p-1 text-brand-light hover:rotate-180 transition-all duration-500">
                            <ArrowPathIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem tab="reports" label="التقارير" icon={<NewReportIcon />} count={newReportsCount}/>
                        <NavItem tab="employees" label="إدارة المنتسبين" icon={<UsersIcon />} />
                        <NavItem tab="sentTasks" label="المهام المرسلة" icon={<ClipboardDocumentListIcon />} />
                        <NavItem tab="profile" label="الملف الشخصي" icon={<UserCircleIcon />} />
                    </nav>
                    <div className="p-4 border-t dark:border-gray-700 space-y-2">
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl">
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="mr-3">خروج</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b dark:border-gray-700 md:hidden z-20 sticky top-0">
                    <div className="flex items-center gap-3">
                        <AppLogoIcon className="w-8 h-8" />
                        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">الإدارة</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                        {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-inherit">
                    <div className="container mx-auto max-w-6xl">
                        {activeTab === 'reports' && <ReportsView />}
                        {activeTab === 'employees' && <UserManagement />}
                        {activeTab === 'sentTasks' && <SentTasksView />}
                        {activeTab === 'profile' && <ProfileManagement user={currentUser} />}
                    </div>
                </main>
            </div>
             {showLogoutConfirm && <ConfirmModal title="خروج" message="هل تريد المغادرة؟" onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} />}
             {notification && <Toast message={notification.message} onClose={clearNotification} onClick={clearNotification} type={notification.type} />}
        </div>
    );
};

export default ManagerDashboard;
