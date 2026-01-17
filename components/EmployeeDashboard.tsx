
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role, Attachment, Report, DirectTask, Task } from '../types';
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
import CameraIcon from './icons/CameraIcon';
import DocumentTextIcon from './icons/DocumentTextIcon';
import InstallIcon from './icons/InstallIcon';
import SparklesIcon from './icons/SparklesIcon';
import XMarkIcon from './icons/XMarkIcon';
import EditIcon from './icons/EditIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, directTasks, submitReport, saveOrUpdateDraft, deleteReport, notification, clearNotification, isSyncing, refreshData } = useData();
    
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isPwaReady, setIsPwaReady] = useState(!!window.deferredPrompt);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [randomGreeting, setRandomGreeting] = useState('');
    const [randomQuote, setRandomQuote] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const greetings = useMemo(() => [
        "طاب يومك، نتمنى لك يوماً مليئاً بالإنجاز.",
        "أهلاً بعودتك، لنواصل رحلة الإبداع معاً.",
        "يسعدنا تواجدك اليوم، أنت ركن أساسي في فريقنا.",
        "بداية يوم موفقة، همتكم العالية سر نجاحنا.",
        "مرحباً بك، يومك يشرق بحضورك وعطائك.",
        "يوم جديد، فرص جديدة للإبداع.. أهلاً بك.",
        "أهلاً بك مجدداً، عملك المتميز يترك أثراً دائماً.",
        "سعداء برؤيتك، لنجعل اليوم يوماً استثنائياً بالإنجازات."
    ], []);

    const quotes = useMemo(() => [
        "النجاح هو مجموع تفاصيل صغيرة أتقنتها كل يوم.",
        "الإبداع لا ينمو إلا في بيئة مليئة بالشغف والعمل الجاد.",
        "لا تبحث عن الفرص، بل اصنعها بعملك المتميز.",
        "كل إنجاز عظيم بدأ بفكرة بسيطة وإصرار كبير.",
        "أنت لا تبني تقريراً فقط، أنت توثق رحلة نجاحك.",
        "اجعل من عملك فناً، ومن فنك رسالة تلمس القلوب.",
        "التميز ليس فعلاً، بل هو عادة نكررها كل صباح."
    ], []);

    useEffect(() => {
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!checkStandalone);

        const handlePromptReady = () => setIsPwaReady(true);
        window.addEventListener('pwa-prompt-ready', handlePromptReady);
        
        const randomGIdx = Math.floor(Math.random() * greetings.length);
        setRandomGreeting(greetings[randomGIdx]);

        const randomQIdx = Math.floor(Math.random() * quotes.length);
        setRandomQuote(quotes[randomQIdx]);

        return () => window.removeEventListener('pwa-prompt-ready', handlePromptReady);
    }, [greetings, quotes]);

    useEffect(() => {
        if (notification) {
            setToast({ message: notification.message, type: notification.type });
        }
    }, [notification]);

    const handleInstallClick = async () => {
        if (window.deferredPrompt) {
            window.deferredPrompt.prompt();
            const { outcome } = await window.deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                window.deferredPrompt = null;
                setIsPwaReady(false);
                setIsStandalone(true);
            }
        } else {
            window.dispatchEvent(new CustomEvent('open-install-instructions'));
        }
    };

    const [reportForm, setReportForm] = useState<{
        tasks: Task[],
        accomplished: string,
        notAccomplished: string,
        attachments: Attachment[]
    }>({
        tasks: [{ id: Date.now().toString(), text: '', isDone: false }],
        accomplished: '',
        notAccomplished: '',
        attachments: []
    });

    const completionPercentage = useMemo(() => {
        const total = reportForm.tasks.filter(t => t.text.trim() !== '').length;
        if (total === 0) return 0;
        const done = reportForm.tasks.filter(t => t.text.trim() !== '' && t.isDone).length;
        return Math.round((done / total) * 100);
    }, [reportForm.tasks]);

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

    // Robust sorting that handles potential invalid date formats from legacy data
    const myReports = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id && r.status === 'submitted')
               .sort((a,b) => {
                   const dateA = new Date(a.date).getTime();
                   const dateB = new Date(b.date).getTime();
                   // Safe sort: if date is invalid (NaN), treat as 0
                   return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
               })
    , [reports, currentUser]);

    const myDrafts = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id && r.status === 'draft')
               .sort((a,b) => {
                   const dateA = new Date(a.date).getTime();
                   const dateB = new Date(b.date).getTime();
                   return (isNaN(dateB) ? 0 : dateB) - (isNaN(dateA) ? 0 : dateA);
               })
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
            if (activeTab === 'new-report') {
                 if (!editingDraftId) resetForm();
            } else {
                setActiveTab('drafts');
            }
        } catch (error) {
            setToast({ message: 'خطأ في الحفظ.', type: 'info' });
        }
    };

    const handleSubmitReportClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        if (nonEmptyTasks.length === 0) {
            setToast({ message: 'أضف مهمة واحدة على الأقل قبل الإرسال.', type: 'info' });
            return;
        }
        setShowSubmitConfirm(true);
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setShowSubmitConfirm(false);
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        try {
            await submitReport({
                userId: currentUser.id,
                date: new Date().toISOString().split('T')[0],
                day: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date()),
                tasks: nonEmptyTasks.map(t => ({ id: t.id, text: t.text, isDone: t.isDone })),
                accomplished: reportForm.accomplished,
                notAccomplished: reportForm.notAccomplished,
                attachments: reportForm.attachments
            }, editingDraftId || undefined);

            resetForm();
            setToast({ message: 'تم إرسال التقرير النهائي بنجاح!', type: 'success' });
            setActiveTab('archive');
        } catch (error) {
            console.error(error);
            setToast({ message: 'فشل الإرسال، يرجى التحقق من الانترنت والمحاولة.', type: 'info' });
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
    };

    const NavItem: React.FC<{tabName: string; label: string; icon: React.ReactNode; count?: number}> = ({tabName, label, icon, count}) => {
        const isActive = activeTab === tabName;
        return (
             <button
                onClick={() => { setActiveTab(tabName); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-xl ${isActive ? 'bg-brand-light text-white shadow-lg shadow-brand-light/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
            >
                <div className="w-6 h-6">{icon}</div>
                <span className="mr-3">{label}</span>
                {count && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full">{count}</span> : null}
            </button>
        );
    };

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
                        <h1 className="text-lg font-bold dark:text-gray-100">نظام مهامي</h1>
                        <div className="flex items-center gap-1 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] text-gray-400">اتصال مباشر آمن</span>
                        </div>
                    </div>
                    
                    <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem tabName="home" label="الرئيسية" icon={<HomeIcon className="w-6 h-6"/>} />
                        <NavItem tabName="new-report" label="مركز المهام" icon={<NewReportIcon className="w-6 h-6"/>} />
                        <NavItem tabName="drafts" label="المسودات" icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} count={myDrafts.length} />
                        <NavItem tabName="tasks" label="المهام الواردة" icon={<InboxIcon className="w-6 h-6"/>} count={unreadTasksCount}/>
                        <NavItem tabName="archive" label="الأرشيف" icon={<ArchiveBoxIcon className="w-6 h-6"/>} />
                        <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-6 h-6"/>} />
                    </nav>
                    
                    <div className="p-4 border-t dark:border-gray-800 space-y-2 mb-safe">
                        {!isStandalone && (
                            <button onClick={handleInstallClick} className="flex items-center w-full px-4 py-3 text-sm font-bold text-white bg-brand-light rounded-xl shadow-lg border border-white/10">
                                <InstallIcon className="w-6 h-6"/>
                                <span className="mr-3 text-xs">تثبيت التطبيق</span>
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
                        <h2 className="text-lg font-bold dark:text-gray-100">المهام اليومية</h2>
                        <button 
                            onClick={() => refreshData()}
                            className="p-1.5 text-brand-light"
                            disabled={isSyncing}
                        >
                            <ArrowPathIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-2xl"><MenuIcon className="w-6 h-6" /></button>
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
                                        
                                        <h3 className="text-3xl font-bold z-10">أهلاً بك، {currentUser.fullName.split(' ')[0]}</h3>
                                        <p className="text-white/90 text-sm mt-3 z-10 font-medium bg-white/10 px-6 py-2 rounded-full backdrop-blur-sm">
                                            {randomGreeting}
                                        </p>
                                        
                                        <div className="mt-8 pt-6 border-t border-white/20 w-full max-w-sm z-10">
                                            <p className="text-white/80 text-xs uppercase tracking-widest font-bold mb-1">تاريخ اليوم</p>
                                            <p className="text-xl font-bold">
                                                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* بطاقة ملخص الحالة اليومية */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         <div onClick={() => setActiveTab('new-report')} className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-transform hover:scale-[1.02] active:scale-95">
                                            <div className="w-12 h-12 bg-brand-light/10 text-brand-light rounded-2xl flex items-center justify-center mb-4">
                                                <EditIcon className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-lg font-bold dark:text-white">التقرير الحالي</h4>
                                            <p className="text-xs text-gray-500 mt-1">اضغط هنا لاستكمال كتابة مهام اليوم</p>
                                            {myDrafts.length > 0 && <span className="mt-4 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-[10px] font-bold">لديك مسودة قيد العمل</span>}
                                        </div>

                                        <div onClick={() => setActiveTab('tasks')} className="cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center transition-transform hover:scale-[1.02] active:scale-95">
                                            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mb-4">
                                                <InboxIcon className="w-6 h-6" />
                                            </div>
                                            <h4 className="text-lg font-bold dark:text-white">المهام الواردة</h4>
                                            <p className="text-xs text-gray-500 mt-1">يوجد {unreadTasksCount} مهمة جديدة بانتظار ردك</p>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-2 h-full bg-brand-light"></div>
                                        <div className="flex flex-col items-center text-center">
                                            <div className="text-4xl text-brand-light/20 font-serif mb-2">"</div>
                                            <p className="text-lg font-bold text-gray-800 dark:text-gray-100 leading-relaxed max-w-lg">
                                                {randomQuote}
                                            </p>
                                            <div className="mt-6 flex items-center gap-2">
                                                <div className="w-1 h-1 bg-brand-light rounded-full"></div>
                                                <div className="w-8 h-1 bg-brand-light/30 rounded-full"></div>
                                                <div className="w-1 h-1 bg-brand-light rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'new-report' && (
                                <form onSubmit={handleSubmitReportClick} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between border-b dark:border-gray-700 pb-4">
                                        <div>
                                            <h3 className="text-xl font-bold dark:text-white">{editingDraftId ? 'تحديث المسودة' : 'كتابة المهام اليومية'}</h3>
                                            <p className="text-xs text-gray-500 mt-1">وثق إنجازاتك أولاً بأول خلال ساعات الدوام</p>
                                        </div>
                                        <div className="text-left">
                                            <div className="text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-widest">نسبة الإنجاز اللحظي</div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                    <div className="h-full bg-brand-light transition-all duration-500" style={{ width: `${completionPercentage}%` }}></div>
                                                </div>
                                                <span className="text-sm font-bold text-brand-light">{completionPercentage}%</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400">قائمة المهام (اضغط على الدائرة عند الإنجاز):</label>
                                        <div className="space-y-3">
                                            {reportForm.tasks.map((task, index) => (
                                                <div key={task.id} className={`flex gap-3 p-3 rounded-2xl border transition-all ${task.isDone ? 'bg-green-50/50 border-green-100 dark:bg-green-900/10 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-600'}`}>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, isDone: !t.isDone } : t) }))}
                                                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 mt-1.5 ${task.isDone ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 dark:border-gray-500'}`}
                                                    >
                                                        {task.isDone && <CheckCircleIcon className="w-4 h-4" />}
                                                    </button>
                                                    <textarea 
                                                        value={task.text} 
                                                        onChange={(e) => setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))} 
                                                        placeholder={`صف المهمة ${index + 1} هنا...`} 
                                                        rows={2}
                                                        className={`flex-1 bg-transparent dark:text-white outline-none text-sm leading-relaxed resize-none transition-all ${task.isDone ? 'text-gray-500 line-through' : ''}`} 
                                                    />
                                                    {reportForm.tasks.length > 1 && (
                                                        <button type="button" onClick={() => setReportForm(p => ({...p, tasks: p.tasks.filter(t => t.id !== task.id)}))} className="p-2 text-red-400 hover:text-red-600 h-fit rounded-xl hover:bg-red-50">
                                                            <TrashIcon className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={() => setReportForm(p => ({...p, tasks: [...p.tasks, {id: Date.now().toString(), text: '', isDone: false}]}))} className="flex items-center text-xs font-bold text-brand-light hover:bg-brand-light/10 px-4 py-2 rounded-xl transition-all"><PlusIcon className="w-4 h-4 ml-1" /> إضافة سطر مهمة جديد</button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mr-2">خلاصة ما تم إنجازه</label>
                                            <textarea placeholder="ملخص الإنجاز اليومي..." value={reportForm.accomplished} onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} rows={3} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/30 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase mr-2">المعوقات والمقترحات</label>
                                            <textarea placeholder="أي معوقات واجهتك اليوم..." value={reportForm.notAccomplished} onChange={e => setReportForm(p => ({...p, notAccomplished: e.target.value}))} rows={3} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/30 transition-all" />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">التوثيق والمرفقات:</label>
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-brand-light/5 hover:border-brand-light/30 transition-all">
                                                <DocumentTextIcon className="w-6 h-6" />
                                                <span>ملف / مستند</span>
                                            </button>
                                            <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-brand-light/5 hover:border-brand-light/30 transition-all">
                                                <CameraIcon className="w-6 h-6" />
                                                <span>التقاط صورة</span>
                                            </button>
                                        </div>
                                        <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                                        <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

                                        {reportForm.attachments.length > 0 && (
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                                                {reportForm.attachments.map((file, idx) => (
                                                    <div key={idx} className="relative group p-2 bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-sm overflow-hidden">
                                                        <button type="button" onClick={() => removeAttachment(idx)} className="absolute top-1 left-1 bg-red-500 text-white rounded-full p-1 shadow-lg z-10 scale-0 group-hover:scale-100 transition-transform"><XMarkIcon className="w-3 h-3" /></button>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            {file.type.startsWith('image/') ? <img src={file.content} className="w-8 h-8 rounded-lg object-cover" /> : <div className="w-8 h-8 bg-brand-light/10 text-brand-light rounded-lg flex items-center justify-center shrink-0"><PaperclipIcon className="w-4 h-4" /></div>}
                                                            <div className="flex-1 min-w-0"><p className="text-[10px] font-bold truncate dark:text-white">{file.name}</p></div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t dark:border-gray-700">
                                        <button type="button" onClick={handleSaveDraft} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-brand-dark dark:text-gray-200 rounded-2xl font-bold shadow-md hover:bg-gray-200 transition-all">حفظ كمسودة للعودة لاحقاً</button>
                                        <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-brand-light text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-light/30 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3">
                                            {isSubmitting ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 'إرسال التقرير النهائي الآن'}
                                        </button>
                                    </div>
                                </form>
                            )}
                            
                            {activeTab === 'archive' && (
                                <div className="space-y-4 animate-fade-in">
                                    <h3 className="text-xl font-bold dark:text-white mb-4">أرشيف التقارير المرسلة</h3>
                                    {myReports.map(r => <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />)}
                                    {myReports.length === 0 && <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"><p className="text-gray-500">لا يوجد تقارير في الأرشيف حالياً.</p></div>}
                                </div>
                            )}
                            {activeTab === 'tasks' && <DirectTasksView />}
                            {activeTab === 'drafts' && (
                                 <div className="space-y-4 animate-fade-in">
                                 <h3 className="text-xl font-bold dark:text-white mb-4">مسودات اليوم ({myDrafts.length})</h3>
                                 {myDrafts.length > 0 ? myDrafts.map(draft => (
                                     <div key={draft.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-brand-light transition-all">
                                         <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className="text-[10px] font-bold text-brand-light bg-brand-light/10 px-2 py-0.5 rounded-full">مسودة قيد التعديل</span>
                                                 <span className="text-xs text-gray-500">{draft.date}</span>
                                             </div>
                                             <p className="text-sm font-bold dark:text-white truncate max-w-xs">{draft.tasks[0]?.text || 'مسودة فارغة'}</p>
                                         </div>
                                         <div className="flex gap-2">
                                             <button onClick={() => handleEditDraft(draft)} className="p-3 text-brand-light bg-brand-light/10 rounded-xl hover:bg-brand-light/20 transition-all"><EditIcon className="w-5 h-5" /></button>
                                             <button onClick={() => deleteReport(draft.id)} className="p-3 text-red-500 bg-red-50 rounded-xl hover:bg-red-100 transition-all"><TrashIcon className="w-5 h-5" /></button>
                                         </div>
                                     </div>
                                 )) : <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700"><p className="text-gray-500">لا توجد مسودات حالياً.</p></div>}
                             </div>
                            )}
                            {activeTab === 'profile' && <ProfileManagement user={currentUser} />}
                        </div>

                        <footer className="mt-12 py-8 border-t dark:border-gray-800 text-center space-y-2 no-print">
                            <div className="flex justify-center items-center gap-3 opacity-30 grayscale mb-4">
                                <div className="w-8 h-8"><AppLogoIcon /></div>
                                <span className="text-sm font-bold dark:text-white">نظام مهامي الإلكتروني</span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">© جميع الحقوق محفوظة {new Date().getFullYear()}م</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">تطوير: حسين كاظم</p>
                        </footer>
                    </div>
                </main>
            </div>

            {selectedReport && <ReportDetailModal report={selectedReport} user={currentUser} viewerRole={Role.EMPLOYEE} onClose={() => setSelectedReport(null)} />}
            {toast && <Toast message={toast.message} onClose={() => { setToast(null); clearNotification(); }} onClick={() => setToast(null)} type={toast.type} />}
            
            {showSubmitConfirm && (
                <ConfirmModal 
                    title="تأكيد إرسال التقرير" 
                    message="هل أنت متأكد من صحة جميع البيانات؟ سيتم إرسال التقرير للمسؤول للمراجعة والتقييم، ولن تتمكن من تعديله لاحقاً." 
                    onConfirm={handleFinalSubmit} 
                    onCancel={() => setShowSubmitConfirm(false)} 
                    confirmText="إرسال نهائي"
                    cancelText="مراجعة"
                />
            )}

            {showLogoutConfirm && (
                <ConfirmModal 
                    title="تأكيد الخروج" 
                    message="هل أنت متأكد من رغبتك في تسجيل الخروج؟ سيتم إغلاق الجلسة الحالية." 
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
