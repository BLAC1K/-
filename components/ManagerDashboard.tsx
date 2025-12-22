import React, { useState, useEffect, useRef } from 'react';
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
import BellIcon from './icons/BellIcon';
import InstallIcon from './icons/InstallIcon';

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const ManagerDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, users } = useData();
    const [activeTab, setActiveTab] = useState('reports');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [toast, setToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isPwaReady, setIsPwaReady] = useState(!!window.deferredPrompt);

    const lastNotifiedReportId = useRef<string | null>(null);

    useEffect(() => {
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!checkStandalone);

        const handlePromptReady = () => setIsPwaReady(true);
        const handleInstalled = () => {
            setIsStandalone(true);
            setIsPwaReady(false);
        };

        window.addEventListener('pwa-prompt-ready', handlePromptReady);
        window.addEventListener('pwa-installed-success', handleInstalled);

        return () => {
            window.removeEventListener('pwa-prompt-ready', handlePromptReady);
            window.removeEventListener('pwa-installed-success', handleInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                window.deferredPrompt = null;
                setIsPwaReady(false);
            }
        } else {
             const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
            if (isIos) {
                window.dispatchEvent(new CustomEvent('open-install-instructions'));
            } else if (!isStandalone) {
                setToast({ message: 'المتصفح يجهز ملفات التثبيت، حاول مرة أخرى بعد قليل.', type: 'info' });
            }
        }
    };

    const triggerNotification = async (title: string, body: string) => {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.play().catch(() => {});

        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
                body,
                icon: '/icon.png',
                badge: '/icon.png',
                vibrate: [300, 100, 300],
                requireInteraction: true
            } as any);
        } else if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon.png' });
        }
        setToast({ message: body, type: 'info' });
    };

    useEffect(() => {
        const submittedReports = reports.filter(r => r.status === 'submitted');
        if (submittedReports.length > 0) {
            const newestReport = submittedReports[submittedReports.length - 1];
            if (newestReport.id !== lastNotifiedReportId.current) {
                const sender = users.find(u => u.id === newestReport.userId);
                triggerNotification("وصول تقرير جديد", `قام المنتسب ${sender?.fullName || 'غير معروف'} بإرسال تقريره اليومي.`);
                lastNotifiedReportId.current = newestReport.id;
            }
        }
    }, [reports, users]);

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
            case 'employees': return <div className="pb-20"><UserManagement /></div>;
            case 'sentTasks': return <div className="pb-20"><SentTasksView /></div>;
            case 'profile': return <div className="pb-20"><ProfileManagement user={currentUser} /></div>;
            case 'reports':
            default: return <div className="pb-20"><ReportsView /></div>;
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
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-xl ${isActive ? 'bg-brand-light text-white shadow-lg shadow-brand-light/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
            >
                {icon}
                <span className="mr-3">{label}</span>
                {count && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full">{count}</span> : null}
            </button>
        )
    }

    return (
        <div className="h-[100dvh] w-full bg-[#f8f9fa] dark:bg-[#121212] flex overflow-hidden">
             {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-72 h-full bg-white dark:bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-700">
                    <div className="flex items-center p-6 border-b dark:border-gray-700 gap-3">
                        <div className="w-10 h-10">
                            <AppLogoIcon />
                        </div>
                        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">لوحة التحكم</h1>
                    </div>
                    <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem tabName="reports" label="التقارير" icon={<NewReportIcon className="w-6 h-6"/>} count={newReportsCount}/>
                        <NavItem tabName="employees" label="إدارة المنتسبين" icon={<UsersIcon className="w-6 h-6"/>} />
                        <NavItem tabName="sentTasks" label="المهام المرسلة" icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} />
                        <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-6 h-6"/>} />
                    </nav>
                    <div className="p-4 border-t dark:border-gray-700 space-y-2 mb-safe">
                        {!isStandalone && (
                            <button onClick={handleInstallClick} className="flex items-center w-full px-4 py-3 text-sm font-bold text-white bg-brand-light rounded-xl active:scale-95 transition-transform shadow-lg shadow-brand-light/30 border border-white/10">
                                <InstallIcon className="w-6 h-6"/>
                                <span className="mr-3 text-xs">تثبيت التطبيق الآن</span>
                            </button>
                        )}
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl active:scale-95 transition-transform">
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="mr-3">خروج من الحساب</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b dark:border-gray-700 md:hidden z-20 sticky top-0 safe-area-top">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8">
                            <AppLogoIcon />
                        </div>
                        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{pageTitles[activeTab]}</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg active:scale-90 transition-transform">
                        {isSidebarOpen ? <XMarkIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
                    </button>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar bg-inherit">
                    <div className="container mx-auto max-w-6xl">
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