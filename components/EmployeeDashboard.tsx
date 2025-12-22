
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role, Attachment, Report, Task, DirectTask } from '../types';
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
import PercentageCircle from './StarRating';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XMarkIcon from './icons/XMarkIcon';
import EditIcon from './icons/EditIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, directTasks, addReport, saveOrUpdateDraft, deleteReport } = useData();
    
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [toast, setToast] = useState<{message: string, type: 'info' | 'success'} | null>(null);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isPwaReady, setIsPwaReady] = useState(!!window.deferredPrompt);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const [plannerTasks, setPlannerTasks] = useState<Task[]>(() => {
        const saved = localStorage.getItem(`planner_${currentUser?.id}`);
        return saved ? JSON.parse(saved) : [{ id: Date.now().toString(), text: '', isDone: false }];
    });

    useEffect(() => {
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        setIsStandalone(!!checkStandalone);

        const handlePromptReady = () => setIsPwaReady(true);
        window.addEventListener('pwa-prompt-ready', handlePromptReady);
        return () => window.removeEventListener('pwa-prompt-ready', handlePromptReady);
    }, []);

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

    const plannerProgress = useMemo(() => {
        const total = plannerTasks.filter(t => t.text.trim() !== '').length;
        if (total === 0) return 0;
        const done = plannerTasks.filter(t => t.text.trim() !== '' && t.isDone).length;
        return (done / total) * 100;
    }, [plannerTasks]);

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
        if (isSubmitting) return;
        setIsSubmitting(true);
        
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
            setToast({ message: 'تم حفظ المسودة بنجاح في قسم المسودات.', type: 'success' });
            resetForm();
            setActiveTab('drafts');
        } catch (error) {
            console.error("Draft Save Error:", error);
            setToast({ message: 'فشل في حفظ المسودة، يرجى المحاولة لاحقاً.', type: 'info' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        
        const nonEmptyTasks = reportForm.tasks.filter(t => t.text.trim() !== '');
        if (nonEmptyTasks.length === 0) {
            setToast({ message: 'يرجى إضافة مهمة واحدة على الأقل قبل الإرسال.', type: 'info' });
            return;
        }

        setIsSubmitting(true);
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
            if (editingDraftId) {
                await deleteReport(editingDraftId);
            }
            await addReport(reportData);
            resetForm();
            setToast({ message: 'تم إرسال التقرير النهائي بنجاح!', type: 'success' });
            setActiveTab('archive');
        } catch (error) {
            setToast({ message: 'فشل إرسال التقرير.', type: 'info' });
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
    };

    const handleDeleteDraft = async (draftId: string) => {
        if (confirm('هل أنت متأكد من حذف هذه المسودة؟')) {
            await deleteReport(draftId);
            setToast({ message: 'تم حذف المسودة بنجاح.', type: 'success' });
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
                                        <p className="text-[10px] opacity-70">تم إنجاز {plannerTasks.filter(t => t.isDone && t.text).length} مهام</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {!isStandalone && (
                            <button 
                                onClick={handleInstallClick}
                                className="w-full p-6 bg-brand-light text-white rounded-[32px] flex items-center justify-between group active:scale-[0.98] transition-all shadow-xl shadow-brand-light/20 border-2 border-white/10 animate-fade-in"
                            >
                                <div className="flex items-center gap-4 text-right">
                                    <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                                        <InstallIcon className="w-8 h-8" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl">تثبيت التطبيق الآن</h4>
                                        <p className="text-xs opacity-80">حوّل النظام إلى تطبيق رسمي على هاتفك</p>
                                    </div>
                                </div>
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                    <PlusIcon className="w-6 h-6" />
                                </div>
                            </button>
                        )}

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 flex items-center">
                                    <SparklesIcon className="w-5 h-5 ml-2 text-brand-accent-yellow" />
                                    مخطط المهام اليومي
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {plannerTasks.map((task, idx) => (
                                    <div key={task.id} className="flex items-center gap-3">
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
                                    </div>
                                ))}
                                <button 
                                    onClick={() => setPlannerTasks(p => [...p, {id: Date.now().toString(), text: '', isDone: false}])}
                                    className="flex items-center text-xs font-bold text-brand-light mt-2 p-1"
                                >
                                    <PlusIcon className="w-4 h-4 ml-1" /> إضافة مهمة
                                </button>
                            </div>
                        </div>
                    </div>
                );
            case 'new-report':
                return (
                    <form onSubmit={handleSubmitReport} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6 animate-fade-in pb-20">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100">{editingDraftId ? 'تعديل المسودة' : 'إرسال التقرير النهائي'}</h3>
                            {editingDraftId && (
                                <button type="button" onClick={resetForm} className="text-xs text-red-500 hover:underline">إلغاء التعديل</button>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400">المهام التي تم العمل عليها:</label>
                            {reportForm.tasks.map((task, index) => (
                                <div key={task.id} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={task.text}
                                        onChange={(e) => setReportForm(prev => ({ ...prev, tasks: prev.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))}
                                        placeholder={`المهمة ${index + 1}...`}
                                        className="flex-1 px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none"
                                    />
                                    {index > 0 && (
                                        <button type="button" onClick={() => setReportForm(p => ({...p, tasks: p.tasks.filter(t => t.id !== task.id)}))} className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                            <button type="button" onClick={() => setReportForm(p => ({...p, tasks: [...p.tasks, {id: Date.now().toString(), text: ''}]}))} className="flex items-center text-xs font-bold text-brand-light">
                                <PlusIcon className="w-4 h-4 ml-1" /> إضافة سطر مهمة
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">ما تم إنجازه فعلياً:</label>
                                <textarea placeholder="اكتب تفاصيل الإنجاز..." value={reportForm.accomplished} onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} rows={3} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/50" />
                            </div>
                            
                            <div>
                                <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block mb-2">ما لم يتم إنجازه / المعوقات:</label>
                                <textarea placeholder="اكتب مالم يتم إنجازه أو أي معوقات واجهتك..." value={reportForm.notAccomplished} onChange={e => setReportForm(p => ({...p, notAccomplished: e.target.value}))} rows={3} className="w-full px-4 py-3 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-light/50" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-bold text-gray-600 dark:text-gray-400 block">المرفقات والوثائق:</label>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                    <DocumentTextIcon className="w-6 h-6" />
                                    <span>ملف / مستند</span>
                                </button>
                                <button type="button" onClick={() => cameraInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 p-4 bg-gray-100 dark:bg-gray-700 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">
                                    <CameraIcon className="w-6 h-6" />
                                    <span>صورة كاميرا</span>
                                </button>
                            </div>
                            
                            <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileChange} />
                            <input type="file" ref={cameraInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />

                            {reportForm.attachments.length > 0 && (
                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    {reportForm.attachments.map((file, idx) => (
                                        <div key={idx} className="relative group p-2 bg-gray-50 dark:bg-gray-700 rounded-xl border dark:border-gray-600">
                                            <button type="button" onClick={() => removeAttachment(idx)} className="absolute -top-2 -left-2 bg-red-500 text-white rounded-full p-1 shadow-lg z-10">
                                                <XMarkIcon className="w-4 h-4" />
                                            </button>
                                            <div className="flex items-center gap-2">
                                                {file.type.startsWith('image/') ? (
                                                    <img src={file.content} className="w-10 h-10 rounded-lg object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 bg-brand-light/10 text-brand-light rounded-lg flex items-center justify-center">
                                                        <PaperclipIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-bold truncate text-gray-700 dark:text-gray-200">{file.name}</p>
                                                    <p className="text-[8px] text-gray-500">{(file.size / 1024).toFixed(0)} KB</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <button 
                                type="button" 
                                onClick={handleSaveDraft} 
                                disabled={isSubmitting}
                                className="flex-1 py-4 bg-gray-100 dark:bg-gray-700 text-brand-dark dark:text-gray-200 rounded-2xl font-bold shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'جارِ المعالجة...' : 'حفظ كمسودة'}
                            </button>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className="flex-[2] py-4 bg-brand-light text-white rounded-2xl font-bold text-lg shadow-xl shadow-brand-light/30 active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {isSubmitting ? 'جارِ الإرسال...' : 'إرسال التقرير للمسؤول'}
                            </button>
                        </div>
                    </form>
                );
            case 'drafts':
                return (
                    <div className="space-y-4 animate-fade-in pb-20">
                        <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4">المسودات المحفوظة ({myDrafts.length})</h3>
                        {myDrafts.length > 0 ? (
                            myDrafts.map(draft => (
                                <div key={draft.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group hover:border-brand-light transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-bold text-brand-light bg-brand-light/10 px-2 py-0.5 rounded-full">مسودة</span>
                                            <span className="text-xs text-gray-500">{draft.date}</span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate max-w-xs">
                                            {draft.tasks.length > 0 ? draft.tasks[0].text : 'مسودة بدون عنوان'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => handleEditDraft(draft)} className="p-2 text-brand-light hover:bg-brand-light/10 rounded-xl transition-all" title="تعديل">
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button onClick={() => handleDeleteDraft(draft.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all" title="حذف">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                                <ArchiveBoxIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">لا توجد مسودات حالياً.</p>
                                <button onClick={() => setActiveTab('new-report')} className="mt-4 text-brand-light font-bold text-sm">ابدأ بكتابة تقرير جديد</button>
                            </div>
                        )}
                    </div>
                );
            case 'tasks': return <div className="pb-20"><DirectTasksView /></div>;
            case 'archive': return <div className="pb-20 space-y-4">{myReports.map(r => <ReportView key={r.id} report={r} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />)}</div>;
            case 'profile': return <div className="pb-20"><ProfileManagement user={currentUser} /></div>;
            default: return null;
        }
    };

    return (
        <div className="h-[100dvh] w-full bg-[#fcfdfe] dark:bg-[#0d1117] flex overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-72 h-full bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-800">
                    <div className="flex flex-col items-center p-6 border-b dark:border-gray-800 gap-2">
                        <div className="w-10 h-10"><AppLogoIcon /></div>
                        <h1 className="text-lg font-bold dark:text-gray-100">مهامي اليومية</h1>
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
                            <button onClick={handleInstallClick} className="flex items-center w-full px-4 py-3 text-sm font-bold text-white bg-brand-light rounded-xl active:scale-95 shadow-lg shadow-brand-light/20 transition-all border border-white/10">
                                <InstallIcon className="w-6 h-6"/>
                                <span className="mr-3 text-xs">تثبيت التطبيق الآن</span>
                            </button>
                        )}
                        <ThemeToggle />
                        <button onClick={logout} className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 rounded-xl active:scale-95">
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="mr-3">خروج</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 md:hidden z-20 sticky top-0 safe-area-top">
                    <div className="flex items-center gap-2"><div className="w-8 h-8"><AppLogoIcon /></div><h2 className="text-lg font-bold dark:text-gray-100">مهامي</h2></div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-2xl"><MenuIcon className="w-6 h-6" /></button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
                    <div className="container mx-auto max-w-4xl">{renderContent()}</div>
                </main>
            </div>

            {selectedReport && <ReportDetailModal report={selectedReport} user={currentUser} viewerRole={Role.EMPLOYEE} onClose={() => setSelectedReport(null)} />}
            {toast && <Toast message={toast.message} onClose={() => setToast(null)} onClick={() => setToast(null)} type={toast.type} />}
        </div>
    );
};

export default EmployeeDashboard;
