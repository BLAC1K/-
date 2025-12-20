
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role, Attachment, Report } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import LogoutIcon from './icons/LogoutIcon';
import ReportView from './ReportView';
import NewReportIcon from './icons/NewReportIcon';
import InboxIcon from './icons/InboxIcon';
import Avatar from './Avatar';
import ProfileManagement from './ProfileManagement';
import UserCircleIcon from './icons/UserCircleIcon';
import ReportDetailModal from './ReportDetailModal';
import Toast from './Toast';
import MenuIcon from './icons/MenuIcon';
import XMarkIcon from './icons/XMarkIcon';
import ThemeToggle from './ThemeToggle';
import AppLogoIcon from './icons/AppLogoIcon';
import HomeIcon from './icons/HomeIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import DirectTasksView from './DirectTasksView';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmModal from './ConfirmModal';
import BellIcon from './icons/BellIcon';
import InstallIcon from './icons/InstallIcon';

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, directTasks, announcements, addReport } = useData();
    
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);
    
    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    const prevTasksCount = useRef(directTasks.length);
    const prevCommentsCount = useRef(0);
    const prevAnnouncementsCount = useRef(announcements.length);

    const [reportForm, setReportForm] = useState<{
        tasks: { id: string, text: string }[],
        accomplished: string,
        notAccomplished: string,
        attachments: Attachment[]
    }>({
        tasks: [{ id: Date.now().toString(), text: '' }],
        accomplished: '',
        notAccomplished: '',
        attachments: []
    });

    useEffect(() => {
        // Handle PWA Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });

        window.addEventListener('appinstalled', () => {
            setDeferredPrompt(null);
            setToast({ message: 'تم تثبيت التطبيق بنجاح على جهازك!', type: 'success' });
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    if (!currentUser) return null;

    const triggerNotification = (title: string, body: string) => {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.play().catch(e => console.log("Audio play blocked", e));

        if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon-192.png' });
        }
        setToast({ message: body, type: 'info' });
    };

    useEffect(() => {
        if (Notification.permission === 'default') Notification.requestPermission();

        const myTasks = directTasks.filter(t => t.employeeId === currentUser.id);
        if (myTasks.length > prevTasksCount.current) {
            triggerNotification("مهمة جديدة", "لقد استلمت مهمة جديدة من المسؤول.");
        }
        prevTasksCount.current = myTasks.length;

        const myReportsWithComments = reports.filter(r => r.userId === currentUser.id && r.managerComment && !r.isCommentReadByEmployee);
        if (myReportsWithComments.length > prevCommentsCount.current) {
            triggerNotification("تعليق جديد", "قام المسؤول بالتعليق على أحد تقاريرك.");
        }
        prevCommentsCount.current = myReportsWithComments.length;

        if (announcements.length > prevAnnouncementsCount.current) {
            triggerNotification("توجيه جديد", "تم نشر توجيه أو تعميم جديد للجميع.");
        }
        prevAnnouncementsCount.current = announcements.length;
    }, [directTasks, reports, announcements, currentUser.id]);

    const myReports = useMemo(() => 
        reports.filter(r => r.userId === currentUser.id)
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser.id]);

    const unreadTasksCount = useMemo(() => 
        directTasks.filter(t => t.employeeId === currentUser.id && t.status === 'pending' && !t.isReadByEmployee).length
    , [directTasks, currentUser.id]);

    const handleAddTask = () => {
        setReportForm(prev => ({ ...prev, tasks: [...prev.tasks, { id: Date.now().toString(), text: '' }] }));
    };

    const handleRemoveTask = (id: string) => {
        setReportForm(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== id) }));
    };

    const handleTaskChange = (id: string, text: string) => {
        setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === id ? { ...t, text } : t) }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            Array.from(files).forEach((file: File) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setReportForm(prev => ({
                        ...prev,
                        attachments: [...prev.attachments, {
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            content: reader.result as string
                        }]
                    }));
                };
                reader.readAsDataURL(file);
            });
        }
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        if (nonEmptyTasks.length === 0) {
            setToast({ message: 'يرجى إضافة مهمة واحدة على الأقل.', type: 'info' });
            return;
        }

        const reportData = {
            userId: currentUser.id,
            date: new Date().toISOString().split('T')[0],
            day: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date()),
            tasks: nonEmptyTasks.map(t => ({ id: t.id, text: t.text })),
            accomplished: reportForm.accomplished,
            notAccomplished: reportForm.notAccomplished,
            attachments: reportForm.attachments
        };

        try {
            await addReport(reportData);
            setReportForm({
                tasks: [{ id: Date.now().toString(), text: '' }],
                accomplished: '',
                notAccomplished: '',
                attachments: []
            });
            setToast({ message: 'تم إرسال التقرير بنجاح!', type: 'success' });
            setActiveTab('archive');
        } catch (error) {
            setToast({ message: 'فشل إرسال التقرير.', type: 'info' });
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
        );
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'home':
                return (
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md border border-gray-100 dark:border-gray-700">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">ملخص الأداء</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 text-sm">إجمالي التقارير</span>
                                        <span className="font-bold text-brand-dark dark:text-gray-100">{myReports.length}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-gray-600 dark:text-gray-400 text-sm">مهام واردة</span>
                                        <span className="font-bold text-brand-dark dark:text-gray-100">{unreadTasksCount}</span>
                                    </div>
                                </div>
                            </div>
                             <div className="bg-brand-light/5 dark:bg-brand-light/10 p-6 rounded-xl shadow-md border border-brand-light/20 flex flex-col justify-center items-center text-center">
                                <AppLogoIcon className="w-16 h-16 text-brand-light mb-2" />
                                <h3 className="text-lg font-bold text-brand-dark dark:text-brand-light">أهلاً بك، {currentUser.fullName.split(' ')[0]}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">الرقم الوظيفي: {currentUser.badgeNumber}</p>
                                <button onClick={() => setActiveTab('new-report')} className="mt-4 px-4 py-2 bg-brand-light text-white rounded-md hover:bg-brand-dark transition-colors text-sm font-bold shadow-sm">إنشاء تقرير اليوم</button>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">التقارير الأخيرة</h3>
                            <button onClick={() => setActiveTab('archive')} className="text-brand-light text-sm font-semibold hover:underline">عرض الأرشيف</button>
                        </div>
                        <div className="space-y-4">
                            {myReports.slice(0, 3).map(r => (
                                <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />
                            ))}
                            {myReports.length === 0 && <p className="text-center py-10 text-gray-500">لا توجد تقارير سابقة.</p>}
                        </div>
                    </div>
                );
            case 'new-report':
                return (
                    <form onSubmit={handleSubmitReport} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-6 animate-fade-in">
                        <div>
                            <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-2 flex items-center">
                                <NewReportIcon className="w-6 h-6 ml-2" />
                                إضافة تقرير يومي جديد
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ اليوم: {new Date().toLocaleDateString('ar-EG', { dateStyle: 'full' })}</p>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">المهام التي تم العمل عليها اليوم</label>
                            {reportForm.tasks.map((task, index) => (
                                <div key={task.id} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={task.text}
                                        onChange={(e) => handleTaskChange(task.id, e.target.value)}
                                        placeholder={`المهمة ${index + 1}...`}
                                        className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-brand-light transition-all"
                                        required
                                    />
                                    {reportForm.tasks.length > 1 && (
                                        <button type="button" onClick={() => handleRemoveTask(task.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={handleAddTask} className="flex items-center text-sm font-bold text-brand-light hover:text-brand-dark transition-colors">
                                <PlusIcon className="w-4 h-4 ml-1" />
                                إضافة حقل مهمة آخر
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">تفاصيل ما تم إنجازه</label>
                                <textarea
                                    value={reportForm.accomplished}
                                    onChange={(e) => setReportForm(prev => ({ ...prev, accomplished: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المعوقات أو ما لم ينجز</label>
                                <textarea
                                    value={reportForm.notAccomplished}
                                    onChange={(e) => setReportForm(prev => ({ ...prev, notAccomplished: e.target.value }))}
                                    rows={4}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-200"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                            <button type="submit" className="px-8 py-3 bg-brand-light text-white rounded-lg hover:bg-brand-dark transition-all font-bold shadow-md">
                                إرسال التقرير للمسؤول
                            </button>
                        </div>
                    </form>
                );
            case 'tasks': return <DirectTasksView />;
            case 'archive':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                            <ArchiveBoxIcon className="w-6 h-6 ml-2" />
                            سجل التقارير اليومية
                        </h3>
                        {myReports.map(r => (
                            <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />
                        ))}
                    </div>
                );
            case 'profile': return <ProfileManagement user={currentUser} />;
            default: return null;
        }
    };

    return (
        <div className="h-[100dvh] w-full bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-64 h-full bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-700">
                    <div className="flex items-center justify-center py-6 border-b dark:border-gray-700">
                        <AppLogoIcon className="w-8 h-8 text-brand-dark dark:text-gray-100" />
                        <h1 className="mr-2 text-lg font-bold text-brand-dark dark:text-gray-100">لوحة المنتسب</h1>
                    </div>
                    
                    <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
                        <NavItem tabName="home" label="الرئيسية" icon={<HomeIcon className="w-5 h-5"/>} />
                        <NavItem tabName="new-report" label="إرسال تقرير" icon={<NewReportIcon className="w-5 h-5"/>} />
                        <NavItem tabName="tasks" label="المهام الواردة" icon={<InboxIcon className="w-5 h-5"/>} count={unreadTasksCount}/>
                        <NavItem tabName="archive" label="الأرشيف" icon={<ArchiveBoxIcon className="w-5 h-5"/>} />
                        <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-5 h-5"/>} />
                    </nav>
                    
                    <div className="p-4 border-t dark:border-gray-700 space-y-2">
                        {deferredPrompt && (
                            <button onClick={handleInstallClick} className="flex items-center w-full px-3 py-2 text-sm font-bold text-brand-light bg-brand-light/10 hover:bg-brand-light/20 rounded-lg transition-colors border border-brand-light/20">
                                <InstallIcon className="w-5 h-5"/>
                                <span className="mr-3 text-right">تثبيت التطبيق</span>
                            </button>
                        )}
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <LogoutIcon className="w-5 h-5"/>
                            <span className="mr-3">خروج</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b dark:border-gray-700 md:hidden z-20 shadow-sm">
                    <div className="flex items-center">
                        <AppLogoIcon className="w-8 h-8 ml-3 text-brand-dark dark:text-gray-100" />
                        <h2 className="text-xl font-bold text-brand-dark dark:text-gray-100">مهامي</h2>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} aria-label="Open Menu">
                        <MenuIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 no-scrollbar">
                    <div className="container mx-auto max-w-5xl">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {selectedReport && <ReportDetailModal report={selectedReport} user={currentUser} viewerRole={Role.EMPLOYEE} onClose={() => setSelectedReport(null)} />}
            {toast && <Toast message={toast.message} onClose={() => setToast(null)} onClick={() => setToast(null)} />}
            {showLogoutConfirm && <ConfirmModal title="تأكيد الخروج" message="هل تريد حقاً تسجيل الخروج؟" onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} confirmText="خروج" />}
        </div>
    );
};

export default EmployeeDashboard;
