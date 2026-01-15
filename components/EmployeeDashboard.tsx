
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
import ReportDetail from './ReportDetail';
import Toast from './Toast';
import MenuIcon from './icons/MenuIcon';
import ThemeToggle from './ThemeToggle';
import AppLogoIcon from './icons/AppLogoIcon';
import HomeIcon from './icons/HomeIcon';
import DirectTasksView from './DirectTasksView';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmModal from './ConfirmModal';
import CameraIcon from './icons/CameraIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import InstallIcon from './icons/InstallIcon';
import SparklesIcon from './icons/SparklesIcon';
import XMarkIcon from './icons/XMarkIcon';
import EditIcon from './icons/EditIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';
import DownloadIcon from './icons/DownloadIcon';
import * as api from '../services/apiService';

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, directTasks, addReport, saveOrUpdateDraft, deleteReport, notification, clearNotification, isSyncing, refreshData } = useData();
    
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [viewingReport, setViewingReport] = useState<Report | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isPwaReady, setIsPwaReady] = useState(!!window.deferredPrompt);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

    // للميزات اللحظية
    const [someoneTyping, setSomeoneTyping] = useState<string | null>(null);
    const broadcastChannelRef = useRef<any>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!checkStandalone);

        const handlePromptReady = () => setIsPwaReady(true);
        window.addEventListener('pwa-prompt-ready', handlePromptReady);

        // إعداد البث اللحظي
        if (currentUser) {
            broadcastChannelRef.current = api.subscribeToBroadcast('typing', (payload) => {
                if (payload.payload.userId !== currentUser.id) {
                    setSomeoneTyping(payload.payload.isTyping ? payload.payload.userName : null);
                    // إخفاء المؤشر تلقائياً بعد 3 ثواني
                    if (payload.payload.isTyping) {
                        setTimeout(() => setSomeoneTyping(null), 3000);
                    }
                }
            });
        }

        return () => {
            window.removeEventListener('pwa-prompt-ready', handlePromptReady);
        };
    }, [currentUser]);

    useEffect(() => {
        if (notification) {
            setToast({ message: notification.message, type: notification.type });
        }
    }, [notification]);

    const [reportForm, setReportForm] = useState<{
        tasks: { id: string, text: string, isDone?: boolean }[],
        accomplished: string,
        notAccomplished: string,
        attachments: Attachment[]
    }>({
        tasks: [{ id: Date.now().toString(), text: '', isDone: false }],
        accomplished: '',
        notAccomplished: '',
        attachments: []
    });

    // إبلاغ الآخرين بالكتابة
    const notifyTyping = () => {
        if (broadcastChannelRef.current && currentUser) {
            api.sendBroadcast(broadcastChannelRef.current, 'typing', {
                userId: currentUser.id,
                userName: currentUser.fullName.split(' ')[0],
                isTyping: true
            });
        }
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
            e.target.value = '';
        }
    };

    const removeAttachment = (index: number) => {
        setReportForm(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const myReports = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id && r.status === 'submitted')
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser]);

    const myDrafts = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id && r.status === 'draft')
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser]);

    const unreadTasksCount = useMemo(() => 
        directTasks.filter(t => t.employeeId === currentUser?.id && t.status === 'pending' && !t.isReadByEmployee).length
    , [directTasks, currentUser]);

    if (!currentUser) return null;

    const resetForm = () => {
        setReportForm({
            tasks: [{ id: Date.now().toString(), text: '', isDone: false }],
            accomplished: '',
            notAccomplished: '',
            attachments: []
        });
        setEditingDraftId(null);
    };

    const handleSaveDraft = async () => {
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        const draftData: Partial<Report> = {
            id: editingDraftId || undefined,
            userId: currentUser.id,
            date: new Date().toISOString().split('T')[0],
            day: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date()),
            tasks: nonEmptyTasks.map(t => ({ id: t.id, text: t.text, isDone: t.isDone })),
            accomplished: reportForm.accomplished,
            notAccomplished: reportForm.notAccomplished,
            attachments: reportForm.attachments
        };
        try {
            await saveOrUpdateDraft(draftData);
            setToast({ message: 'تم حفظ المسودة بنجاح.', type: 'success' });
            resetForm();
            setActiveTab('drafts');
        } catch (error) {
            setToast({ message: 'فشل حفظ المسودة.', type: 'info' });
        }
    };

    const handleSubmitReportClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        if (nonEmptyTasks.length === 0) {
            setToast({ message: 'يرجى كتابة مهمة واحدة على الأقل.', type: 'info' });
            return;
        }
        setShowSubmitConfirm(true);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setShowSubmitConfirm(false);
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        try {
            if (editingDraftId) await deleteReport(editingDraftId);
            await addReport({
                userId: currentUser.id,
                date: new Date().toISOString().split('T')[0],
                day: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date()),
                tasks: nonEmptyTasks.map(t => ({ id: t.id, text: t.text, isDone: t.isDone })),
                accomplished: reportForm.accomplished,
                notAccomplished: reportForm.notAccomplished,
                attachments: reportForm.attachments
            });
            resetForm();
            setToast({ message: 'تم إرسال تقرير المهام بنجاح!', type: 'success' });
            setActiveTab('archive');
        } catch (error) {
            setToast({ message: 'فشل إرسال التقرير.', type: 'info' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditDraft = (draft: Report) => {
        setReportForm({
            tasks: draft.tasks.length > 0 ? draft.tasks.map(t => ({...t})) : [{ id: Date.now().toString(), text: '', isDone: false }],
            accomplished: draft.accomplished,
            notAccomplished: draft.notAccomplished,
            attachments: draft.attachments || []
        });
        setEditingDraftId(draft.id);
        setActiveTab('new-report');
        setViewingReport(null);
    };

    const openReportViewer = async (report: Report) => {
        setViewingReport(report);
        // جلب المرفقات فوراً إذا كانت فارغة (Lazy Loading)
        if (!report.attachments || report.attachments.length === 0) {
            setIsLoadingAttachments(true);
            try {
                const attachments = await api.fetchReportAttachments(report.id);
                setViewingReport(prev => prev ? { ...prev, attachments } : null);
            } catch (e) {
                console.error("Error fetching attachments", e);
            } finally {
                setIsLoadingAttachments(false);
            }
        }
    };

    const toggleTaskStatus = (id: string) => {
        setReportForm(prev => ({
            ...prev,
            tasks: prev.tasks.map(t => t.id === id ? { ...t, isDone: !t.isDone } : t)
        }));
    };

    const NavItem: React.FC<{tabName: string; label: string; icon: React.ReactNode; count?: number}> = ({tabName, label, icon, count}) => {
        const isActive = activeTab === tabName && !viewingReport;
        return (
             <button
                onClick={() => { setActiveTab(tabName); setViewingReport(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl ${isActive ? 'bg-brand-light text-white shadow-lg shadow-brand-light/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
            >
                <div className="w-6 h-6">{icon}</div>
                <span className="mr-3">{label}</span>
                {count && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full animate-bounce">{count}</span> : null}
            </button>
        );
    };

    if (viewingReport) {
        return (
            <div className="h-[100dvh] w-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden animate-fade-in">
                <header id="report-header" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 no-print sticky top-0 z-50">
                    <button 
                        onClick={() => setViewingReport(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-brand-dark dark:text-gray-100 rounded-xl shadow-sm border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-bold active:scale-95"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>العودة للقائمة</span>
                    </button>
                    <div className="flex items-center gap-2">
                        {isLoadingAttachments && (
                            <div className="px-3 py-1 bg-brand-light/10 text-brand-light rounded-full text-[10px] font-bold animate-pulse">
                                جاري جلب الصور...
                            </div>
                        )}
                         <button
                            onClick={() => window.print()}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-light text-white rounded-xl font-bold shadow-md hover:bg-brand-dark transition-all text-xs"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>طباعة / PDF</span>
                        </button>
                    </div>
                </header>
                <div id="printable-area" className="flex-1 overflow-y-auto no-scrollbar">
                    <ReportDetail report={viewingReport} user={currentUser} viewerRole={Role.EMPLOYEE} />
                </div>
            </div>
        );
    }

    return (
        <div className="h-[100dvh] w-full bg-[#fcfdfe] dark:bg-[#0d1117] flex overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-72 h-full bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-800">
                    <div className="flex flex-col items-center p-6 border-b dark:border-gray-800 gap-2 relative">
                        <button 
                            onClick={() => refreshData()}
                            className={`absolute top-4 left-4 p-2 rounded-full bg-brand-light/10 text-brand-light hover:bg-brand-light/20 transition-all active:scale-90 ${isSyncing ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            title="تحديث البيانات"
                            disabled={isSyncing}
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="w-10 h-10"><AppLogoIcon /></div>
                        <h1 className="text-lg font-bold dark:text-gray-100">مهامي اليومية</h1>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-gray-400">اتصال لحظي فعال</span>
                        </div>
                    </div>
                    
                    <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem tabName="home" label="الرئيسية" icon={<HomeIcon className="w-6 h-6"/>} />
                        <NavItem tabName="new-report" label="لوحة المهام" icon={<NewReportIcon className="w-6 h-6"/>} />
                        <NavItem tabName="drafts" label="المسودات" icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} count={myDrafts.length} />
                        <NavItem tabName="tasks" label="المهام الواردة" icon={<InboxIcon className="w-6 h-6"/>} count={unreadTasksCount}/>
                        <NavItem tabName="archive" label="الأرشيف" icon={<ArchiveBoxIcon className="w-6 h-6"/>} />
                        <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-6 h-6"/>} />
                    </nav>
                    
                    <div className="p-4 border-t dark:border-gray-800 space-y-2 mb-safe">
                        {!isStandalone && (
                            <button onClick={() => { if (window.deferredPrompt) window.deferredPrompt.prompt(); else window.dispatchEvent(new CustomEvent('open-install-instructions')); }} className="flex items-center w-full px-4 py-3 text-sm font-bold text-white bg-brand-light rounded-xl shadow-lg border border-white/10">
                                <InstallIcon className="w-6 h-6"/>
                                <span className="mr-3 text-xs">تثبيت كـتطبيق</span>
                            </button>
                        )}
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 rounded-xl">
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="mr-3">خروج</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 md:hidden z-20 sticky top-0 safe-area-top">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8"><AppLogoIcon /></div>
                        <h2 className="text-lg font-bold dark:text-gray-100">مهامي</h2>
                    </div>
                    <div className="flex items-center gap-3">
                         {someoneTyping && (
                            <div className="text-[10px] text-brand-light font-bold animate-pulse bg-brand-light/10 px-2 py-1 rounded-lg">
                                {someoneTyping} يكتب...
                            </div>
                        )}
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-2xl"><MenuIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar bg-inherit">
                    <div className="container mx-auto max-w-4xl min-h-full flex flex-col">
                        <div className="flex-grow">
                            {activeTab === 'home' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="bg-gradient-to-br from-brand-light to-brand-dark p-8 rounded-[2.5rem] shadow-2xl flex flex-col items-center text-center text-white relative overflow-hidden transition-all duration-500">
                                        <div className="absolute top-0 right-0 p-6 opacity-10"><AppLogoIcon className="w-40 h-40" /></div>
                                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                                        <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md mb-4 ring-4 ring-white/10">
                                            <SparklesIcon className="w-12 h-12 text-brand-accent-yellow" />
                                        </div>
                                        <h3 className="text-3xl font-bold z-10">مرحباً بك، {currentUser.fullName.split(' ')[0]}</h3>
                                        <p className="text-white/90 text-sm mt-2 z-10 font-medium">سجل مهامك اليومية وتابع إنجازاتك.</p>
                                        <div className="mt-8 pt-6 border-t border-white/20 w-full max-w-sm z-10">
                                            <p className="text-xl font-bold">
                                                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {/* مؤشر تفاعلي لمن يكتب الآن */}
                                    {someoneTyping && (
                                        <div className="hidden md:flex items-center gap-3 p-4 bg-brand-light/10 rounded-3xl border border-brand-light/20 animate-fade-in">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-brand-light rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-brand-light rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                <div className="w-2 h-2 bg-brand-light rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                            </div>
                                            <p className="text-sm font-bold text-brand-light">{someoneTyping} يقوم بكتابة تقريره الآن...</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button onClick={() => setActiveTab('new-report')} className="p-6 bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm flex flex-col items-center gap-3 transition-transform hover:scale-105 active:scale-95">
                                            <div className="w-12 h-12 bg-brand-light/10 text-brand-light rounded-2xl flex items-center justify-center">
                                                <PlusIcon className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold dark:text-white">كتابة مهام اليوم</span>
                                        </button>
                                        <button onClick={() => setActiveTab('tasks')} className="p-6 bg-white dark:bg-gray-800 rounded-3xl border dark:border-gray-700 shadow-sm flex flex-col items-center gap-3 transition-transform hover:scale-105 active:scale-95 relative">
                                            <div className="w-12 h-12 bg-brand-accent-yellow/10 text-brand-accent-yellow rounded-2xl flex items-center justify-center">
                                                <InboxIcon className="w-6 h-6" />
                                            </div>
                                            <span className="font-bold dark:text-white">المهام الواردة</span>
                                            {unreadTasksCount > 0 && <span className="absolute top-4 right-4 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-gray-800 animate-pulse">{unreadTasksCount}</span>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'new-report' && (
                                <form onSubmit={handleSubmitReportClick} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold dark:text-white">{editingDraftId ? 'تعديل المسودة' : 'جدول المهام اليومية'}</h3>
                                        <span className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-full font-bold">بث مباشر للمدير</span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400">قائمة المهام:</label>
                                            <button type="button" onClick={() => setReportForm(p => ({...p, tasks: [...p.tasks, {id: Date.now().toString(), text: '', isDone: false}]}))} className="p-2 bg-brand-light/10 text-brand-light rounded-full hover:bg-brand-light/20 transition-all">
                                                <PlusIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            {reportForm.tasks.map((task, index) => (
                                                <div key={task.id} className="flex gap-3 group animate-scale-in">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => toggleTaskStatus(task.id)}
                                                        className={`w-6 h-6 mt-3 rounded-md border-2 transition-all flex items-center justify-center shrink-0 ${task.isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                    >
                                                        {task.isDone && <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                    </button>
                                                    <textarea 
                                                        value={task.text} 
                                                        onFocus={notifyTyping}
                                                        onChange={(e) => setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))} 
                                                        placeholder={`اكتب المهمة ${index + 1} هنا...`} 
                                                        rows={2}
                                                        className={`flex-1 px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/50 transition-all resize-none ${task.isDone ? 'opacity-50 line-through' : ''}`} 
                                                    />
                                                    {reportForm.tasks.length > 1 && (
                                                        <button type="button" onClick={() => setReportForm(p => ({...p, tasks: p.tasks.filter(t => t.id !== task.id)}))} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 h-fit rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t dark:border-gray-700">
                                        <textarea 
                                            placeholder="ما هي أبرز الإنجازات اليوم؟" 
                                            value={reportForm.accomplished} 
                                            onFocus={notifyTyping}
                                            onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} 
                                            rows={3} 
                                            className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/50" 
                                        />
                                        <textarea 
                                            placeholder="هل واجهتك أي معوقات؟" 
                                            value={reportForm.notAccomplished} 
                                            onFocus={notifyTyping}
                                            onChange={e => setReportForm(p => ({...p, notAccomplished: e.target.value}))} 
                                            rows={2} 
                                            className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/50" 
                                        />
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                                <DocumentTextIcon className="w-5 h-5" />
                                                <span className="text-xs font-bold">إرفاق ملف</span>
                                            </button>
                                            <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                                <CameraIcon className="w-5 h-5" />
                                                <span className="text-xs font-bold">كاميرا</span>
                                            </button>
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                                        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

                                        {reportForm.attachments.length > 0 && (
                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                {reportForm.attachments.map((file, idx) => (
                                                    <div key={idx} className="relative group p-2 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600">
                                                        <button type="button" onClick={() => removeAttachment(idx)} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-lg z-10"><XMarkIcon className="w-4 h-4" /></button>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            {file.type.startsWith('image/') ? <img src={file.content} className="w-10 h-10 rounded-lg object-cover" /> : <div className="w-10 h-10 bg-brand-light/10 text-brand-light rounded-lg flex items-center justify-center"><PaperclipIcon className="w-5 h-5" /></div>}
                                                            <div className="flex-1 min-w-0"><p className="text-[10px] font-bold truncate dark:text-white">{file.name}</p></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button type="button" onClick={handleSaveDraft} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-brand-dark dark:text-gray-200 rounded-2xl font-bold shadow-md active:scale-95 transition-all">حفظ مؤقت</button>
                                        <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-brand-light text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-light/30 transition-all active:scale-95 disabled:opacity-50">إرسال للمسؤول</button>
                                    </div>
                                </form>
                            )}
                            
                            {activeTab === 'archive' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h3 className="text-xl font-bold dark:text-white mb-4">الأرشيف المنجز</h3>
                                    {myReports.map(r => (
                                        <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => openReportViewer(r)} />
                                    ))}
                                    {myReports.length === 0 && (
                                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                                            <p className="text-gray-500">لا توجد تقارير منجزة حتى الآن.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'tasks' && <DirectTasksView />}
                            
                            {activeTab === 'drafts' && (
                                 <div className="space-y-4 animate-fade-in">
                                 <h3 className="text-xl font-bold dark:text-white mb-4">المسودات الحالية ({myDrafts.length})</h3>
                                 {myDrafts.length > 0 ? myDrafts.map(draft => (
                                     <div key={draft.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                                         <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className="text-[10px] font-bold text-brand-light bg-brand-light/10 px-2 py-0.5 rounded-full uppercase tracking-wider">مسودة</span>
                                                 <span className="text-xs text-gray-500">{draft.date}</span>
                                             </div>
                                             <p className="text-sm font-bold dark:text-white">{draft.tasks[0]?.text || 'بدون عنوان'}</p>
                                         </div>
                                         <div className="flex gap-2">
                                             <button onClick={() => handleEditDraft(draft)} className="p-2 text-brand-light hover:bg-brand-light/10 rounded-xl"><EditIcon className="w-5 h-5" /></button>
                                             <button onClick={() => deleteReport(draft.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><TrashIcon className="w-5 h-5" /></button>
                                         </div>
                                     </div>
                                 )) : <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"><p className="text-gray-500 font-bold">لا توجد مسودات محفوظة.</p></div>}
                             </div>
                            )}
                            {activeTab === 'profile' && <ProfileManagement user={currentUser} />}
                        </div>

                        <footer className="mt-12 py-8 border-t dark:border-gray-800 text-center space-y-2 no-print">
                            <p className="text-xs text-gray-400 font-medium tracking-wide">© نظام المهام اليومية الداخلي - 2025م</p>
                        </footer>
                    </div>
                </main>
            </div>

            {toast && <Toast message={toast.message} onClose={() => { setToast(null); clearNotification(); }} onClick={() => setToast(null)} type={toast.type} />}
            
            {showSubmitConfirm && (
                <ConfirmModal 
                    title="تأكيد إرسال المهام" 
                    message="هل أنت متأكد من اكتمال تقرير اليوم؟ سيتم إرساله للمدير فوراً." 
                    onConfirm={handleFinalSubmit} 
                    onCancel={() => setShowSubmitConfirm(false)} 
                    confirmText="تأكيد"
                    cancelText="تراجع"
                />
            )}

            {showLogoutConfirm && (
                <ConfirmModal 
                    title="تسجيل خروج" 
                    message="هل ترغب في مغادرة النظام الآن؟" 
                    onConfirm={logout} 
                    onCancel={() => setShowLogoutConfirm(false)} 
                    confirmText="خروج"
                    cancelText="بقاء"
                />
            )}
        </div>
    );
};

export default EmployeeDashboard;
