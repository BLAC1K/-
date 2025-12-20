import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role, Attachment, Report, Task } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import LogoutIcon from './icons/LogoutIcon';
import ReportView from './ReportView';
import NewReportIcon from './icons/NewReportIcon';
import InboxIcon from './icons/InboxIcon';
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
import BellIcon from './icons/BellIcon';
import CameraIcon from './icons/CameraIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import XMarkIcon from './icons/XMarkIcon';
import InstallIcon from './icons/InstallIcon';
import SparklesIcon from './icons/SparklesIcon';
import PercentageCircle from './StarRating';
import CheckCircleIcon from './icons/CheckCircleIcon';

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

    // Planner state
    const [plannerTasks, setPlannerTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem(`planner_${currentUser?.id}`);
        return saved ? JSON.parse(saved) : [{ id: Date.now().toString(), text: '', isDone: false }];
    });

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const lastNotifiedTaskId = useRef<string | null>(null);
    const lastNotifiedCommentId = useRef<string | null>(null);
    const lastNotifiedAnnId = useRef<string | null>(null);

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
        if (currentUser) {
            localStorage.setItem(`planner_${currentUser.id}`, JSON.stringify(plannerTasks));
        }
    }, [plannerTasks, currentUser]);

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        });
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            setToast({ message: 'التطبيق مثبت بالفعل أو متصفحك لا يدعم التثبيت المباشر.', type: 'info' });
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') setDeferredPrompt(null);
    };

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                setToast({ message: 'تم تفعيل إشعارات المتصفح بنجاح!', type: 'success' });
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
                tag: 'task-alert',
                requireInteraction: true
            } as any);
        } else if (Notification.permission === 'granted') {
            new Notification(title, { body, icon: '/icon.png' });
        }
        setToast({ message: body, type: 'info' });
    };

    useEffect(() => {
        if (!currentUser) return;
        const myPendingTasks = directTasks.filter(t => t.employeeId === currentUser.id && t.status === 'pending');
        if (myPendingTasks.length > 0) {
            const newestTask = myPendingTasks[0];
            if (newestTask.id !== lastNotifiedTaskId.current) {
                triggerNotification("مهمة جديدة واردة", newestTask.content.substring(0, 50) + "...");
                lastNotifiedTaskId.current = newestTask.id;
            }
        }
        const myReportsWithNewComments = reports.filter(r => r.userId === currentUser.id && r.managerComment && !r.isCommentReadByEmployee);
        if (myReportsWithNewComments.length > 0) {
            const newestReport = myReportsWithNewComments[0];
            if (newestReport.id !== lastNotifiedCommentId.current) {
                triggerNotification("تعليق جديد من المسؤول", "قام المسؤول بالتعليق على أحد تقاريرك.");
                lastNotifiedCommentId.current = newestReport.id;
            }
        }
        if (announcements.length > 0) {
            const newestAnn = announcements[0];
            if (newestAnn.id !== lastNotifiedAnnId.current) {
                triggerNotification("توجيه إداري جديد", newestAnn.content.substring(0, 50) + "...");
                lastNotifiedAnnId.current = newestAnn.id;
            }
        }
    }, [directTasks, reports, announcements, currentUser]);

    const myReports = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id)
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser]);

    const unreadTasksCount = useMemo(() => 
        directTasks.filter(t => t.employeeId === currentUser?.id && t.status === 'pending' && !t.isReadByEmployee).length
    , [directTasks, currentUser]);

    const plannerProgress = useMemo(() => {
        const total = plannerTasks.filter(t => t.text.trim() !== '').length;
        if (total === 0) return 0;
        const done = plannerTasks.filter(t => t.text.trim() !== '' && t.isDone).length;
        return (done / total) * 100;
    }, [plannerTasks]);

    if (!currentUser) return null;

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
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setReportForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const importFromPlanner = () => {
        const tasksToImport = plannerTasks.filter(t => t.text.trim() !== '');
        if (tasksToImport.length === 0) {
            setToast({ message: 'لا توجد مهام في المخطط لاستيرادها.', type: 'info' });
            return;
        }

        const accomplished = tasksToImport.filter(t => t.isDone).map(t => t.text).join('\n');
        const notAccomplished = tasksToImport.filter(t => !t.isDone).map(t => t.text).join('\n');

        setReportForm(prev => ({
            ...prev,
            tasks: tasksToImport.map(t => ({ id: t.id, text: t.text })),
            accomplished: accomplished,
            notAccomplished: notAccomplished
        }));
        setToast({ message: 'تم استيراد المهام من مخطط اليوم بنجاح!', type: 'success' });
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
            // Clear planner after submission
            setPlannerTasks([{ id: Date.now().toString(), text: '', isDone: false }]);
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
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-xl ${isActive ? 'bg-brand-light text-white shadow-lg shadow-brand-light/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
            >
                <div className="w-6 h-6">{icon}</div>
                <span className="mr-3">{label}</span>
                {count && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full">{count}</span> : null}
            </button>
        );
    };

    const renderContent = () => {
        switch(activeTab) {
            case 'home':
                return (
                    <div className="space-y-6 animate-fade-in pb-20">
                        <div className="bg-gradient-to-br from-brand-light to-brand-dark p-6 rounded-3xl shadow-xl flex flex-col items-center text-center text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <AppLogoIcon className="w-24 h-24" />
                            </div>
                            <h3 className="text-2xl font-bold z-10">أهلاً بك، {currentUser.fullName.split(' ')[0]}</h3>
                            <p className="text-white/80 text-sm mt-1 z-10">{new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                            <div className="mt-6 w-full max-w-xs bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
                                <p className="text-xs font-bold mb-3">إنجازك اليوم</p>
                                <div className="flex items-center gap-4">
                                    <PercentageCircle percentage={plannerProgress} size={60} strokeWidth={6} className="text-white" />
                                    <div className="text-right">
                                        <p className="text-lg font-bold">{Math.round(plannerProgress)}%</p>
                                        <p className="text-[10px] opacity-70">تم إنجاز {plannerTasks.filter(t => t.isDone && t.text).length} من أصل {plannerTasks.filter(t => t.text).length} مهام</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                    <SparklesIcon className="w-5 h-5 ml-2 text-brand-accent-yellow" />
                                    مخطط المهام اليومي
                                </h3>
                                <p className="text-[10px] text-gray-400">اكتب مهامك وحدثها خلال اليوم</p>
                            </div>
                            <div className="space-y-2">
                                {plannerTasks.map((task, idx) => (
                                    <div key={task.id} className="flex items-center gap-3 animate-fade-in-up">
                                        <button 
                                            onClick={() => setPlannerTasks(p => p.map(t => t.id === task.id ? {...t, isDone: !t.isDone} : t))}
                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.isDone ? 'bg-brand-accent-green border-brand-accent-green text-white' : 'border-gray-200 dark:border-gray-600'}`}
                                        >
                                            {task.isDone && <CheckCircleIcon className="w-4 h-4" />}
                                        </button>
                                        <input 
                                            type="text"
                                            value={task.text}
                                            onChange={(e) => setPlannerTasks(p => p.map(t => t.id === task.id ? {...t, text: e.target.value} : t))}
                                            placeholder={`مهمة اليوم ${idx + 1}...`}
                                            className={`flex-1 bg-transparent border-none focus:ring-0 text-sm p-1 transition-all ${task.isDone ? 'line-through text-gray-400' : 'text-gray-700 dark:text-gray-200'}`}
                                        />
                                        <button onClick={() => setPlannerTasks(p => p.filter(t => t.id !== task.id))} className="text-gray-300 hover:text-red-400 p-1">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setPlannerTasks(p => [...p, {id: Date.now().toString(), text: '', isDone: false}])}
                                    className="flex items-center text-xs font-bold text-brand-light mt-2 p-1"
                                >
                                    <PlusIcon className="w-4 h-4 ml-1" /> إضافة مهمة للمخطط
                                </button>
                            </div>
                            <div className="pt-4">
                                <button 
                                    onClick={() => setActiveTab('new-report')}
                                    className="w-full py-3 bg-brand-light/10 text-brand-light rounded-2xl font-bold text-sm active:scale-95 transition-all"
                                >
                                    بدء إعداد التقرير النهائي
                                </button>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between px-1 pt-2">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">التقارير الأخيرة</h3>
                            <button onClick={() => setActiveTab('archive')} className="text-brand-light text-sm font-semibold">عرض الأرشيف</button>
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
                    <form onSubmit={handleSubmitReport} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-fade-in pb-20">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100 flex items-center">
                                <NewReportIcon className="w-6 h-6 ml-2" />
                                إنشاء تقرير نهائي
                            </h3>
                            <button 
                                type="button" 
                                onClick={importFromPlanner}
                                className="px-3 py-1.5 bg-brand-accent-yellow/20 text-brand-accent-yellow text-xs font-bold rounded-full border border-brand-accent-yellow/30 active:scale-95"
                            >
                                استيراد من مخطط اليوم
                            </button>
                        </div>

                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">المهام المذكورة في التقرير</label>
                            {reportForm.tasks.map((task, index) => (
                                <div key={task.id} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={task.text}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))}
                                        placeholder={`المهمة ${index + 1}...`}
                                        className="flex-grow px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-brand-light/50 outline-none"
                                        required
                                    />
                                    {reportForm.tasks.length > 1 && (
                                        <button type="button" onClick={() => setReportForm(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== task.id) }))} className="p-2 text-red-500 active:scale-90 transition-transform">
                                            <TrashIcon className="w-6 h-6" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setReportForm(prev => ({ ...prev, tasks: [...prev.tasks, { id: Date.now().toString(), text: '' }] }))} className="text-brand-light text-sm font-bold flex items-center py-2 px-1">
                                <PlusIcon className="w-4 h-4 ml-1" /> إضافة حقل مهمة آخر
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">ما تم إنجازه فعلياً</label>
                                <textarea placeholder="اكتب تفاصيل الإنجاز..." value={reportForm.accomplished} onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} rows={4} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/30" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">المعوقات أو ما لم ينجز</label>
                                <textarea placeholder="اذكر الأسباب في حال عدم الإنجاز..." value={reportForm.notAccomplished} onChange={e => setReportForm(p => ({...p, notAccomplished: e.target.value}))} rows={2} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/30" />
                            </div>
                        </div>
                        
                        <div className="space-y-3 pt-4 border-t dark:border-gray-700">
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">توثيق ومرفقات</label>
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex-1 flex flex-col items-center justify-center p-4 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl active:bg-gray-100 transition-all"
                                >
                                    <PaperclipIcon className="w-6 h-6 mb-2 text-brand-light" />
                                    إرفاق ملف
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => cameraInputRef.current?.click()}
                                    className="flex-1 flex flex-col items-center justify-center p-4 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-700 rounded-2xl active:bg-gray-100 transition-all"
                                >
                                    <CameraIcon className="w-6 h-6 mb-2 text-brand-light" />
                                    تصوير مباشر
                                </button>
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} multiple accept="image/*,application/pdf" className="hidden" />
                            <input type="file" ref={cameraInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />

                            {reportForm.attachments.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {reportForm.attachments.map((file, index) => (
                                        <div key={index} className="relative w-20 h-20 border-2 border-brand-light/20 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800 shadow-sm">
                                            {file.type.startsWith('image/') ? (
                                                <img src={file.content} alt={file.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <DocumentTextIcon className="w-10 h-10 text-brand-light" />
                                                </div>
                                            )}
                                            <button 
                                                type="button"
                                                onClick={() => removeAttachment(index)}
                                                className="absolute top-1 left-1 p-1 bg-red-500 text-white rounded-full shadow-md active:scale-75"
                                            >
                                                <XMarkIcon className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="pt-6">
                            <button type="submit" className="w-full py-5 bg-brand-light text-white rounded-2xl active:scale-95 transition-all font-bold text-lg shadow-xl shadow-brand-light/30">
                                إرسال التقرير النهائي للمسؤول
                            </button>
                        </div>
                    </form>
                );
            case 'tasks': return <div className="pb-20"><DirectTasksView /></div>;
            case 'archive':
                return (
                    <div className="space-y-4 animate-fade-in pb-20">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex items-center px-1">
                            <ArchiveBoxIcon className="w-6 h-6 ml-2 text-brand-light" /> أرشيف التقارير المسلمة
                        </h3>
                        {myReports.map(r => <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />)}
                        {myReports.length === 0 && (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300">
                                <ArchiveBoxIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500 dark:text-gray-400 font-bold">لا يوجد تقارير سابقة في الأرشيف</p>
                            </div>
                        )}
                    </div>
                );
            case 'profile': return <div className="pb-20"><ProfileManagement user={currentUser} /></div>;
            default: return null;
        }
    };

    return (
        <div className="h-[100dvh] w-full bg-[#fcfdfe] dark:bg-[#0d1117] flex overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-72 h-full bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 ease-out md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-800">
                    <div className="flex flex-col items-center p-6 border-b dark:border-gray-800 gap-2 text-center">
                        <div className="w-10 h-10 transition-transform hover:scale-110 duration-500">
                            <AppLogoIcon />
                        </div>
                        <h1 className="text-lg font-bold text-brand-dark dark:text-gray-100">مهامي اليومية</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">شعبة الفنون والمسرح</p>
                    </div>
                    
                    <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem tabName="home" label="الرئيسية" icon={<HomeIcon className="w-6 h-6"/>} />
                        <NavItem tabName="new-report" label="إرسال تقرير" icon={<NewReportIcon className="w-6 h-6"/>} />
                        <NavItem tabName="tasks" label="المهام الواردة" icon={<InboxIcon className="w-6 h-6"/>} count={unreadTasksCount}/>
                        <NavItem tabName="archive" label="الأرشيف" icon={<ArchiveBoxIcon className="w-6 h-6"/>} />
                        <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-6 h-6"/>} />
                    </nav>
                    
                    <div className="p-4 border-t dark:border-gray-800 space-y-2 mb-safe">
                        {deferredPrompt && (
                            <button onClick={handleInstallClick} className="flex items-center w-full px-4 py-3 text-sm font-bold text-white bg-brand-light rounded-xl active:scale-95 transition-transform shadow-lg shadow-brand-light/30">
                                <InstallIcon className="w-6 h-6"/>
                                <span className="mr-3 text-xs">تثبيت التطبيق على الهاتف</span>
                            </button>
                        )}
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl active:scale-95 transition-transform">
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="mr-3 text-right">خروج من الحساب</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 md:hidden z-20 sticky top-0 safe-area-top">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8">
                             <AppLogoIcon />
                        </div>
                        <h2 className="text-lg font-bold text-brand-dark dark:text-gray-100">مهامي</h2>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-2xl active:scale-90 transition-transform">
                        <MenuIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar bg-inherit">
                    <div className="container mx-auto max-w-4xl">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {selectedReport && <ReportDetailModal report={selectedReport} user={currentUser} viewerRole={Role.EMPLOYEE} onClose={() => setSelectedReport(null)} />}
            {toast && <Toast message={toast.message} onClose={() => setToast(null)} onClick={() => { setSelectedReport(null); setToast(null); }} />}
            {showLogoutConfirm && <ConfirmModal title="تأكيد الخروج" message="هل تريد حقاً تسجيل الخروج؟" onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} confirmText="خروج" />}
        </div>
    );
};

export default EmployeeDashboard;