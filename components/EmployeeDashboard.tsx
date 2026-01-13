
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role, Attachment, Report, DirectTask } from '../types';
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

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!checkStandalone);

        const handlePromptReady = () => setIsPwaReady(true);
        window.addEventListener('pwa-prompt-ready', handlePromptReady);

        return () => window.removeEventListener('pwa-prompt-ready', handlePromptReady);
    }, []);

    useEffect(() => {
        if (notification) {
            setToast({ message: notification.message, type: notification.type });
        }
    }, [notification]);

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
            tasks: [{ id: Date.now().toString(), text: '' }],
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
            tasks: nonEmptyTasks.map(t => ({ id: t.id, text: t.text })),
            accomplished: reportForm.accomplished,
            notAccomplished: reportForm.notAccomplished,
            attachments: reportForm.attachments
        };
        try {
            await saveOrUpdateDraft(draftData);
            setToast({ message: 'تم حفظ المسودة.', type: 'success' });
            resetForm();
            setActiveTab('drafts');
        } catch (error) {
            setToast({ message: 'خطأ في الحفظ.', type: 'info' });
        }
    };

    const handleSubmitReportClick = (e: React.FormEvent) => {
        e.preventDefault();
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        if (nonEmptyTasks.length === 0) {
            setToast({ message: 'أضف مهمة واحدة على الأقل.', type: 'info' });
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
                tasks: nonEmptyTasks.map(t => ({ id: t.id, text: t.text })),
                accomplished: reportForm.accomplished,
                notAccomplished: reportForm.notAccomplished,
                attachments: reportForm.attachments
            });
            resetForm();
            setToast({ message: 'تم الإرسال بنجاح!', type: 'success' });
            setActiveTab('archive');
        } catch (error) {
            setToast({ message: 'فشل الإرسال.', type: 'info' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditDraft = (draft: Report) => {
        setReportForm({
            tasks: draft.tasks.length > 0 ? draft.tasks.map(t => ({...t})) : [{ id: Date.now().toString(), text: '' }],
            accomplished: draft.accomplished,
            notAccomplished: draft.notAccomplished,
            attachments: draft.attachments || []
        });
        setEditingDraftId(draft.id);
        setActiveTab('new-report');
        setViewingReport(null);
    };

    const NavItem: React.FC<{tabName: string; label: string; icon: React.ReactNode; count?: number}> = ({tabName, label, icon, count}) => {
        const isActive = activeTab === tabName && !viewingReport;
        return (
             <button
                onClick={() => { setActiveTab(tabName); setViewingReport(null); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
                className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors rounded-xl ${isActive ? 'bg-brand-light text-white shadow-lg shadow-brand-light/30' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
            >
                <div className="w-6 h-6">{icon}</div>
                <span className="mr-3">{label}</span>
                {count && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full">{count}</span> : null}
            </button>
        );
    };

    // عرض التقرير كصفحة مستقلة
    if (viewingReport) {
        return (
            <div className="h-[100dvh] w-full bg-white dark:bg-gray-900 flex flex-col overflow-hidden animate-fade-in">
                {/* رأس الصفحة المستقلة للتقرير مع زر رجوع واضح */}
                <header id="report-header" className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700 no-print sticky top-0 z-50">
                    <button 
                        onClick={() => setViewingReport(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 text-brand-dark dark:text-gray-100 rounded-xl shadow-sm border dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all font-bold active:scale-95"
                    >
                        <ArrowRightIcon className="w-5 h-5" />
                        <span>العودة للقائمة</span>
                    </button>
                    
                    <div className="hidden sm:flex flex-col items-center">
                        <h2 className="text-sm font-bold text-gray-700 dark:text-gray-200">معاينة التقرير النهائي</h2>
                        <span className="text-[10px] text-gray-500">{viewingReport.date} - #{viewingReport.sequenceNumber}</span>
                    </div>

                    <div className="flex items-center gap-2">
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
                     {/* ترويسة الطباعة الرسمية */}
                    <div className="hidden print:block p-8 border-b-2 border-black mb-6">
                        <div className="flex justify-between items-start">
                            <div className="text-right">
                                <h1 className="text-sm font-bold">قسم التنمية والتأهيل الاجتماعي للشباب</h1>
                                <h2 className="text-xs font-bold text-gray-700">شعبة الفنون والمسرح</h2>
                                <p className="text-[10px] mt-4 font-bold">الاسم: <span className="font-medium">{currentUser.fullName}</span></p>
                                <p className="text-[10px]">العنوان الوظيفي: {currentUser.jobTitle}</p>
                            </div>
                            <div className="text-left">
                                <p className="font-bold text-xs">التاريخ: {viewingReport.date}</p>
                                <p className="text-[10px]">التسلسل: {viewingReport.sequenceNumber}</p>
                            </div>
                        </div>
                    </div>

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
                            <span className="text-[10px] text-gray-400">مزامنة لحظية نشطة</span>
                        </div>
                    </div>
                    
                    <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem tabName="home" label="الرئيسية" icon={<HomeIcon className="w-6 h-6"/>} />
                        <NavItem tabName="new-report" label="إرسال تقرير" icon={<NewReportIcon className="w-6 h-6"/>} />
                        <NavItem tabName="drafts" label="المسودات" icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} count={myDrafts.length} />
                        <NavItem tabName="tasks" label="المهام الواردة" icon={<InboxIcon className="w-6 h-6"/>} count={unreadTasksCount}/>
                        <NavItem tabName="archive" label="الأرشيف" icon={<ArchiveBoxIcon className="w-6 h-6"/>} />
                        <NavItem tabName="profile" label="الملف الشخصي" icon={<UserCircleIcon className="w-6 h-6"/>} />
                    </nav>
                    
                    <div className="p-4 border-t dark:border-gray-800 space-y-2 mb-safe">
                        {!isStandalone && (
                            <button onClick={() => { if (window.deferredPrompt) window.deferredPrompt.prompt(); else window.dispatchEvent(new CustomEvent('open-install-instructions')); }} className="flex items-center w-full px-4 py-3 text-sm font-bold text-white bg-brand-light rounded-xl shadow-lg border border-white/10">
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
                                        <p className="text-white/90 text-sm mt-2 z-10 font-medium">نتمنى لك يوماً سعيداً وحافلاً بالإنجاز.</p>
                                        
                                        <div className="mt-8 pt-6 border-t border-white/20 w-full max-w-sm z-10">
                                            <p className="text-white/80 text-xs uppercase tracking-widest font-bold mb-1">تاريخ اليوم</p>
                                            <p className="text-xl font-bold">
                                                {new Date().toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {unreadTasksCount > 0 && (
                                        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-[2rem] border border-red-100 dark:border-red-900/50 flex items-center justify-between animate-pulse">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-2xl flex items-center justify-center text-red-600">
                                                    <InboxIcon className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-red-800 dark:text-red-300">لديك {unreadTasksCount} مهام جديدة</h4>
                                                    <p className="text-xs text-red-600 dark:text-red-400">يرجى الاطلاع عليها في قسم المهام الواردة.</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setActiveTab('tasks')} className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-600/20">عرض المهام</button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'new-report' && (
                                <form onSubmit={handleSubmitReportClick} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xl font-bold dark:text-white">{editingDraftId ? 'تعديل المسودة' : 'تقرير عمل جديد'}</h3>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400">قائمة المهام المنجزة:</label>
                                        {reportForm.tasks.map((task, index) => (
                                            <div key={task.id} className="flex gap-2">
                                                <textarea 
                                                    value={task.text} 
                                                    onChange={(e) => setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))} 
                                                    placeholder={`صف المهمة ${index + 1} هنا...`} 
                                                    rows={2}
                                                    className="flex-1 px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/50 transition-all resize-none" 
                                                />
                                                {index > 0 && (
                                                    <button type="button" onClick={() => setReportForm(p => ({...p, tasks: p.tasks.filter(t => t.id !== task.id)}))} className="p-3 text-red-500 hover:bg-red-50 h-fit rounded-xl">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => setReportForm(p => ({...p, tasks: [...p.tasks, {id: Date.now().toString(), text: ''}]}))} className="flex items-center text-xs font-bold text-brand-light"><PlusIcon className="w-4 h-4 ml-1" /> إضافة مهمة أخرى</button>
                                    </div>

                                    <div className="space-y-4">
                                        <textarea placeholder="ملخص ما تم إنجازه بشكل عام..." value={reportForm.accomplished} onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} rows={3} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none" />
                                        <textarea placeholder="المعوقات والمقترحات (إن وجدت)..." value={reportForm.notAccomplished} onChange={e => setReportForm(p => ({...p, notAccomplished: e.target.value}))} rows={2} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none" />
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">المرفقات والوثائق:</label>
                                        <div className="flex gap-3">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                                <DocumentTextIcon className="w-6 h-6" />
                                                <span>ملف / مستند</span>
                                            </button>
                                            <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                                <CameraIcon className="w-6 h-6" />
                                                <span>كاميرا</span>
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

                                    <div className="flex gap-4">
                                        <button type="button" onClick={handleSaveDraft} className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-brand-dark dark:text-gray-200 rounded-2xl font-bold shadow-md">حفظ كمسودة</button>
                                        <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-brand-light text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-light/30 transition-all active:scale-95 disabled:opacity-50">إرسال التقرير النهائي</button>
                                    </div>
                                </form>
                            )}
                            
                            {activeTab === 'archive' && (
                                <div className="space-y-4">
                                    <h3 className="text-xl font-bold dark:text-white mb-4">أرشيف التقارير المرسلة</h3>
                                    {myReports.map(r => (
                                        <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setViewingReport(r)} />
                                    ))}
                                    {myReports.length === 0 && (
                                        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                                            <p className="text-gray-500">لا توجد تقارير في الأرشيف حالياً.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'tasks' && <DirectTasksView />}
                            
                            {activeTab === 'drafts' && (
                                 <div className="space-y-4 animate-fade-in">
                                 <h3 className="text-xl font-bold dark:text-white mb-4">المسودات المحفوظة ({myDrafts.length})</h3>
                                 {myDrafts.length > 0 ? myDrafts.map(draft => (
                                     <div key={draft.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                                         <div className="flex-1">
                                             <div className="flex items-center gap-2 mb-1">
                                                 <span className="text-xs font-bold text-brand-light bg-brand-light/10 px-2 py-0.5 rounded-full">مسودة</span>
                                                 <span className="text-xs text-gray-500">{draft.date}</span>
                                             </div>
                                             <p className="text-sm font-bold dark:text-white">{draft.tasks[0]?.text || 'مسودة فارغة'}</p>
                                         </div>
                                         <div className="flex gap-2">
                                             <button onClick={() => handleEditDraft(draft)} className="p-2 text-brand-light hover:bg-brand-light/10 rounded-xl"><EditIcon className="w-5 h-5" /></button>
                                             <button onClick={() => deleteReport(draft.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><TrashIcon className="w-5 h-5" /></button>
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
                                <span className="text-sm font-bold dark:text-white">مهامي اليومية</span>
                            </div>
                            <p className="text-xs text-gray-400 font-medium">© جميع الحقوق محفوظة {new Date().getFullYear()}م</p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">تصميم وتطوير: حسين كاظم</p>
                        </footer>
                    </div>
                </main>
            </div>

            {toast && <Toast message={toast.message} onClose={() => { setToast(null); clearNotification(); }} onClick={() => setToast(null)} type={toast.type} />}
            
            {showSubmitConfirm && (
                <ConfirmModal 
                    title="تأكيد إرسال التقرير" 
                    message="هل أنت متأكد من صحة البيانات؟ سيتم إرساله للمسؤول للمراجعة." 
                    onConfirm={handleFinalSubmit} 
                    onCancel={() => setShowSubmitConfirm(false)} 
                    confirmText="تأكيد الإرسال"
                    cancelText="مراجعة"
                />
            )}

            {showLogoutConfirm && (
                <ConfirmModal 
                    title="تأكيد الخروج" 
                    message="هل أنت متأكد من رغبتك في تسجيل الخروج؟" 
                    onConfirm={logout} 
                    onCancel={() => setShowLogoutConfirm(false)} 
                    confirmText="تسجيل الخروج"
                    cancelText="البقاء"
                />
            )}
        </div>
    );
};

export default EmployeeDashboard;
