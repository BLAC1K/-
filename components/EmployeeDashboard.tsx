
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
import ThemeToggle from './ThemeToggle';
import AppLogoIcon from './icons/AppLogoIcon';
import HomeIcon from './icons/HomeIcon';
import DirectTasksView from './DirectTasksView';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmModal from './ConfirmModal';
import InstallIcon from './icons/InstallIcon';
import BellIcon from './icons/BellIcon';
import CameraIcon from './icons/CameraIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import XMarkIcon from './icons/XMarkIcon';

const NOTIFICATION_SOUND_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, directTasks, announcements, addReport } = useData();
    
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
    
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

    // Refs for file inputs
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

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
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                setToast({ message: 'تم تفعيل الإشعارات بنجاح!', type: 'success' });
            }
        }
    };

    const triggerNotification = async (title: string, body: string) => {
        const audio = new Audio(NOTIFICATION_SOUND_URL);
        audio.play().catch(e => console.log("Audio play blocked", e));

        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            registration.showNotification(title, {
                body,
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                vibrate: [200, 100, 200],
                tag: 'task-alert'
            } as any);
        } else if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon-192.png' });
        }
        
        setToast({ message: body, type: 'info' });
    };

    useEffect(() => {
        if (!currentUser) return;

        const myTasks = directTasks.filter(t => t.employeeId === currentUser.id);
        if (myTasks.length > prevTasksCount.current) {
            const newestTask = myTasks[0];
            triggerNotification("مهمة جديدة واردة", newestTask.content.substring(0, 50) + "...");
        }
        prevTasksCount.current = myTasks.length;

        const myReportsWithNewComments = reports.filter(r => r.userId === currentUser.id && r.managerComment && !r.isCommentReadByEmployee);
        if (myReportsWithNewComments.length > prevCommentsCount.current) {
            triggerNotification("تعليق جديد من المسؤول", "قام المسؤول بالتعليق على أحد تقاريرك اليومية.");
        }
        prevCommentsCount.current = myReportsWithNewComments.length;

        if (announcements.length > prevAnnouncementsCount.current) {
            triggerNotification("توجيه إداري جديد", announcements[0].content.substring(0, 50) + "...");
        }
        prevAnnouncementsCount.current = announcements.length;

    }, [directTasks, reports, announcements, currentUser]);

    const myReports = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id)
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser]);

    const unreadTasksCount = useMemo(() => 
        directTasks.filter(t => t.employeeId === currentUser?.id && t.status === 'pending' && !t.isReadByEmployee).length
    , [directTasks, currentUser]);

    if (!currentUser) return null;

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
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
            // Reset input so the same file can be selected again if removed
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setReportForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
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
                        </div>
                    </div>
                );
            case 'new-report':
                return (
                    <form onSubmit={handleSubmitReport} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 space-y-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100 flex items-center">
                                <NewReportIcon className="w-6 h-6 ml-2" />
                                إضافة تقرير يومي جديد
                            </h3>
                            <span className="text-xs text-gray-500">{new Date().toLocaleDateString('ar-EG')}</span>
                        </div>
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">المهام التي تم العمل عليها اليوم</label>
                            {reportForm.tasks.map((task, index) => (
                                <div key={task.id} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={task.text}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))}
                                        placeholder={`المهمة ${index + 1}...`}
                                        className="flex-grow px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-200 focus:ring-brand-light"
                                        required
                                    />
                                    {reportForm.tasks.length > 1 && (
                                        <button type="button" onClick={() => setReportForm(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== task.id) }))} className="p-2 text-red-500">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setReportForm(prev => ({ ...prev, tasks: [...prev.tasks, { id: Date.now().toString(), text: '' }] }))} className="text-brand-light text-sm font-bold flex items-center">
                                <PlusIcon className="w-4 h-4 ml-1" /> إضافة مهمة
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <textarea placeholder="ما تم إنجازه..." value={reportForm.accomplished} onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} rows={4} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
                            <textarea placeholder="المعوقات..." value={reportForm.notAccomplished} onChange={e => setReportForm(p => ({...p, notAccomplished: e.target.value}))} rows={4} className="w-full px-3 py-2 border rounded-md dark:bg-gray-700 dark:text-white" />
                        </div>
                        
                        {/* Attachments Section */}
                        <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center">
                                <PaperclipIcon className="w-5 h-5 ml-1" />
                                المرفقات (صور أو مستندات PDF)
                            </label>
                            
                            <div className="flex flex-wrap gap-3">
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex items-center px-4 py-2 text-sm font-bold text-brand-dark bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                                >
                                    <PaperclipIcon className="w-5 h-5 ml-2 text-brand-light" />
                                    إرفاق ملفات
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex items-center px-4 py-2 text-sm font-bold text-brand-dark bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors border border-gray-300 dark:border-gray-600"
                                >
                                    <CameraIcon className="w-5 h-5 ml-2 text-brand-light" />
                                    التقاط صورة
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileChange} 
                                    multiple 
                                    accept="image/*,application/pdf" 
                                    className="hidden" 
                                />
                                <input 
                                    type="file" 
                                    ref={cameraInputRef} 
                                    onChange={handleFileChange} 
                                    accept="image/*" 
                                    capture="environment" 
                                    className="hidden" 
                                />
                            </div>

                            {/* Attachments Preview */}
                            {reportForm.attachments.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
                                    {reportForm.attachments.map((file, index) => (
                                        <div key={index} className="relative group border dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 h-24 shadow-sm">
                                            {file.type.startsWith('image/') ? (
                                                <img src={file.content} alt={file.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center p-1 text-center">
                                                    <DocumentTextIcon className="w-8 h-8 text-brand-light" />
                                                    <span className="text-[10px] truncate w-full text-gray-600 dark:text-gray-400">{file.name}</span>
                                                </div>
                                            )}
                                            <button 
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-4 border-t dark:border-gray-700">
                            <button type="submit" className="px-8 py-3 bg-brand-light text-white rounded-lg hover:bg-brand-dark transition-all font-bold">إرسال التقرير</button>
                        </div>
                    </form>
                );
            case 'tasks': return <DirectTasksView />;
            case 'archive':
                return (
                    <div className="space-y-4 animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center">
                            <ArchiveBoxIcon className="w-6 h-6 ml-2" /> أرشيف التقارير
                        </h3>
                        {myReports.map(r => <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />)}
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
                        <h1 className="mr-2 text-lg font-bold text-brand-dark dark:text-gray-100">مهامي</h1>
                    </div>
                    
                    <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
                        <NavItem tabName="home" label="الرئيسية" icon={<HomeIcon className="w-5 h-5"/>} />
                        <NavItem tabName="new-report" label="إرسال تقرير" icon={<NewReportIcon className="w-5 h-5"/>} />
                        <NavItem tabName="tasks" label="المهام الواردة" icon={<InboxIcon className="w-5 h-5"/>} count={unreadTasksCount}/>
                        <NavItem tabName="archive" label="الأرشيف" icon={<ArchiveBoxIcon className="w-5 h-5"/>} />
                        <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-5 h-5"/>} />
                    </nav>
                    
                    <div className="p-4 border-t dark:border-gray-700 space-y-2">
                        {notificationPermission === 'default' && (
                            <button onClick={requestNotificationPermission} className="flex items-center w-full px-3 py-2 text-sm font-bold text-brand-light bg-brand-light/10 rounded-lg border border-brand-light/20">
                                <BellIcon className="w-5 h-5"/>
                                <span className="mr-3">تفعيل التنبيهات</span>
                            </button>
                        )}
                        {deferredPrompt && (
                            <button onClick={handleInstallClick} className="flex items-center w-full px-3 py-2 text-sm font-bold text-brand-light bg-brand-light/10 hover:bg-brand-light/20 rounded-lg transition-colors border border-brand-light/20">
                                <InstallIcon className="w-5 h-5"/>
                                <span className="mr-3 text-right">تثبيت التطبيق</span>
                            </button>
                        )}
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <LogoutIcon className="w-5 h-5"/>
                            <span className="mr-3 text-right">خروج</span>
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
