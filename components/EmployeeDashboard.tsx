
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Role, Attachment, Report } from '../types';
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
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import ArrowPathIcon from './icons/ArrowPathIcon';
import SparklesIcon from './icons/SparklesIcon';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import CameraIcon from './icons/CameraIcon';
import XMarkIcon from './icons/XMarkIcon';
import ConfirmModal from './ConfirmModal';

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, directTasks, addReport, notification, clearNotification, isSyncing, refreshData } = useData();
    
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const [reportForm, setReportForm] = useState({
        tasks: [{ id: Date.now().toString(), text: '' }],
        accomplished: '',
        notAccomplished: '',
        attachments: [] as Attachment[]
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const todayDate = useMemo(() => {
        return new Intl.DateTimeFormat('ar-EG', { 
            weekday: 'long', 
            day: 'numeric', 
            month: 'long'
        }).format(new Date());
    }, []);

    const fullYear = new Date().getFullYear();

    const motivationalQuote = useMemo(() => {
        const quotes = [
            "إنجازك اليوم يبني نجاح الغد.",
            "دقتك تعكس مهنيتك العالية.",
            "نقدر جهودك المتميزة دائماً.",
            "الإبداع يبدأ بالالتزام والإتقان."
        ];
        return quotes[Math.floor(Math.random() * quotes.length)];
    }, []);

    const myReports = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id && r.status === 'submitted')
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser]);

    const unreadTasksCount = useMemo(() => 
        directTasks.filter(t => t.employeeId === currentUser?.id && t.status === 'pending' && !t.isReadByEmployee).length
    , [directTasks, currentUser]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;
        
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
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setShowSubmitConfirm(false);
        try {
            await addReport({
                userId: currentUser!.id,
                date: new Date().toISOString().split('T')[0],
                day: new Intl.DateTimeFormat('ar-EG', { weekday: 'long' }).format(new Date()),
                tasks: reportForm.tasks.filter(t => t.text.trim()),
                accomplished: reportForm.accomplished,
                notAccomplished: reportForm.notAccomplished,
                attachments: reportForm.attachments
            });
            setReportForm({ tasks: [{ id: Date.now().toString(), text: '' }], accomplished: '', notAccomplished: '', attachments: [] });
            setActiveTab('archive');
        } catch (e) {} finally { setIsSubmitting(false); }
    };

    const NavItem = ({ tab, label, icon, count }: any) => (
        <button
            onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
            className={`flex items-center w-full px-5 py-3.5 text-sm font-bold transition-all rounded-2xl mb-2 ${activeTab === tab ? 'bg-brand-dark text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
        >
            <div className="w-5 h-5">{icon}</div>
            <span className="mr-3">{label}</span>
            {count > 0 && <span className="mr-auto bg-brand-accent-red text-white text-[10px] font-black px-2 py-0.5 rounded-full">{count}</span>}
        </button>
    );

    return (
        <div className="h-[100dvh] w-full bg-[#f8fafd] dark:bg-[#0d1117] flex overflow-hidden font-['Cairo']">
            {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-72 h-full bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-500 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-800">
                    <div className="p-8 border-b dark:border-gray-800 flex flex-col items-center">
                        <AppLogoIcon className="w-14 h-14 mb-3 drop-shadow-md" />
                        <h1 className="text-sm font-black dark:text-white uppercase tracking-widest text-brand-dark">مهامي اليومية</h1>
                        <button onClick={refreshData} className="mt-2 text-[10px] font-bold text-brand-light flex items-center gap-1.5 opacity-60 hover:opacity-100">
                            <ArrowPathIcon className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                            مزامنة البيانات
                        </button>
                    </div>
                    
                    <nav className="flex-grow px-4 py-6 overflow-y-auto no-scrollbar">
                        <NavItem tab="home" label="الرئيسية" icon={<HomeIcon />} />
                        <NavItem tab="new-report" label="إرسال تقرير" icon={<NewReportIcon />} />
                        <NavItem tab="tasks" label="المهام الواردة" icon={<InboxIcon />} count={unreadTasksCount} />
                        <NavItem tab="archive" label="أرشيف التقارير" icon={<ArchiveBoxIcon />} />
                        <NavItem tab="profile" label="الملف الشخصي" icon={<UserCircleIcon />} />
                    </nav>
                    
                    <div className="p-6 border-t dark:border-gray-800">
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-5 py-3 mt-2 text-xs font-black text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-all">
                            <LogoutIcon className="w-5 h-5 ml-3"/>
                            خروج آمن
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-b dark:border-gray-800 md:hidden z-20">
                    <div className="flex items-center gap-3">
                        <AppLogoIcon className="w-8 h-8" />
                        <h2 className="text-sm font-black dark:text-white">مهامي</h2>
                    </div>
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-gray-500"><MenuIcon className="w-5 h-5" /></button>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
                    <div className="container mx-auto max-w-4xl pb-10">
                        {activeTab === 'home' && (
                            <div className="space-y-6 animate-fade-in">
                                {/* البطاقة الترحيبية الحيوية */}
                                <div className="relative group overflow-hidden bg-gradient-to-br from-[#085A8C] via-[#0b6ba3] to-[#42A5B3] p-10 rounded-[3rem] shadow-2xl shadow-brand-dark/20 text-white">
                                    <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                                        <div className="text-center sm:text-right">
                                            <div className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                                                {todayDate}
                                            </div>
                                            <h3 className="text-3xl font-black mb-2">طاب يومك، {currentUser?.fullName.split(' ')[0]} ✨</h3>
                                            <p className="text-sm opacity-90 font-medium italic max-w-sm leading-relaxed">"{motivationalQuote}"</p>
                                        </div>
                                        <div className="flex flex-col items-center justify-center w-28 h-28 bg-white/10 backdrop-blur-lg rounded-[2.5rem] border border-white/20 shadow-inner">
                                            <p className="text-[9px] font-black uppercase opacity-70 mb-1">المهام</p>
                                            <p className="text-4xl font-black">{unreadTasksCount}</p>
                                        </div>
                                    </div>
                                    {/* عناصر زخرفية حيوية */}
                                    <SparklesIcon className="absolute top-[-20px] left-[-20px] w-40 h-40 opacity-10 rotate-12" />
                                    <div className="absolute bottom-[-30px] right-[-30px] w-40 h-40 bg-white opacity-5 rounded-full blur-3xl"></div>
                                </div>

                                {/* شبكة الأزرار الحيوية */}
                                <div className="grid grid-cols-2 gap-4">
                                    <button onClick={() => setActiveTab('new-report')} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center gap-4 border border-white dark:border-gray-800 group">
                                        <div className="p-4 bg-brand-light/10 text-brand-light rounded-3xl group-hover:scale-110 transition-transform">
                                            <NewReportIcon className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-tighter">تقرير جديد</span>
                                    </button>
                                    
                                    <button onClick={() => setActiveTab('tasks')} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center gap-4 border border-white dark:border-gray-800 group">
                                        <div className="p-4 bg-brand-accent-green/10 text-brand-accent-green rounded-3xl group-hover:scale-110 transition-transform relative">
                                            <InboxIcon className="w-8 h-8" />
                                            {unreadTasksCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-bounce"></span>}
                                        </div>
                                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-tighter">المهام الواردة</span>
                                    </button>
                                    
                                    <button onClick={() => setActiveTab('archive')} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center gap-4 border border-white dark:border-gray-800 group">
                                        <div className="p-4 bg-brand-dark/10 text-brand-dark rounded-3xl group-hover:scale-110 transition-transform">
                                            <ArchiveBoxIcon className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-tighter">الأرشيف</span>
                                    </button>
                                    
                                    <button onClick={() => setActiveTab('profile')} className="p-8 bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col items-center gap-4 border border-white dark:border-gray-800 group">
                                        <div className="p-4 bg-brand-accent-yellow/10 text-brand-accent-yellow rounded-3xl group-hover:scale-110 transition-transform">
                                            <UserCircleIcon className="w-8 h-8" />
                                        </div>
                                        <span className="text-sm font-black text-gray-700 dark:text-gray-200 uppercase tracking-tighter">الملف الشخصي</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tasks' && <DirectTasksView />}
                        
                        {activeTab === 'archive' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="flex items-center justify-between px-2">
                                    <h3 className="font-black text-sm dark:text-white uppercase tracking-widest text-brand-dark">سجل التقارير</h3>
                                    <span className="text-[10px] font-black text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">{myReports.length} تقرير</span>
                                </div>
                                {myReports.map(r => (
                                    <ReportView key={r.id} report={r} user={currentUser!} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />
                                ))}
                            </div>
                        )}

                        {activeTab === 'new-report' && (
                            <form onSubmit={(e) => { e.preventDefault(); setShowSubmitConfirm(true); }} className="bg-white dark:bg-gray-900 p-8 rounded-[3rem] shadow-xl border border-white dark:border-gray-800 space-y-8 animate-fade-in">
                                <div className="flex justify-between items-center pb-6 border-b dark:border-gray-800">
                                    <h3 className="text-lg font-black dark:text-white">إعداد التقرير اليومي</h3>
                                    <span className="text-[10px] font-black text-brand-light bg-brand-light/5 px-4 py-1.5 rounded-full">{new Date().toLocaleDateString('ar-EG')}</span>
                                </div>

                                <div className="space-y-4">
                                    <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mr-2">قائمة الأعمال المنجزة</label>
                                    {reportForm.tasks.map((task, idx) => (
                                        <div key={task.id} className="flex gap-4 animate-fade-in group">
                                            <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-center text-xs font-black text-brand-dark shrink-0 group-focus-within:bg-brand-light group-focus-within:text-white transition-colors">{idx + 1}</div>
                                            <textarea 
                                                value={task.text} 
                                                onChange={(e) => setReportForm(p => ({ ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))} 
                                                placeholder={`تفاصيل العمل المنجز...`} 
                                                className="flex-1 px-5 py-4 text-xs border-none rounded-2xl bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-light/10 outline-none transition-all resize-none" 
                                                rows={1}
                                            />
                                            {idx > 0 && <button type="button" onClick={() => setReportForm(p => ({...p, tasks: p.tasks.filter(t => t.id !== task.id)}))} className="p-2 text-red-400 hover:scale-110"><TrashIcon className="w-5 h-5"/></button>}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setReportForm(p => ({...p, tasks: [...p.tasks, {id: Date.now().toString(), text: ''}]}))} className="text-[11px] font-black text-brand-light flex items-center gap-2 px-6 py-2.5 bg-brand-light/5 rounded-2xl hover:bg-brand-light/10 transition-all"><PlusIcon className="w-4 h-4"/> إضافة سطر جديد</button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest mr-2">خلاصة الإنجاز</label>
                                        <textarea placeholder="اكتب خلاصة يومك هنا..." value={reportForm.accomplished} onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} className="w-full p-6 text-xs border-none rounded-[2rem] bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-light/10" rows={3} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-gray-400 mb-2 uppercase tracking-widest mr-2">المعوقات والمقترحات</label>
                                        <textarea placeholder="أي تحديات واجهتك؟" value={reportForm.notAccomplished} onChange={e => setReportForm(p => ({...p, notAccomplished: e.target.value}))} className="w-full p-6 text-xs border-none rounded-[2rem] bg-gray-50 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-brand-light/10" rows={3} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-black text-gray-400 mb-4 uppercase tracking-widest mr-2">المرفقات والوثائق</label>
                                    <div className="flex flex-wrap gap-4">
                                        {reportForm.attachments.map((file, idx) => (
                                            <div key={idx} className="relative w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                                                <img src={file.content} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => setReportForm(p => ({...p, attachments: p.attachments.filter((_, i) => i !== idx)}))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-lg shadow-lg"><XMarkIcon className="w-3 h-3"/></button>
                                            </div>
                                        ))}
                                        <button type="button" onClick={() => fileInputRef.current?.click()} className="w-20 h-20 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl flex items-center justify-center text-gray-300 hover:text-brand-light hover:border-brand-light transition-all bg-gray-50 dark:bg-gray-800/50"><CameraIcon className="w-7 h-7" /></button>
                                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept="image/*" />
                                    </div>
                                </div>

                                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-brand-dark text-white rounded-[2rem] font-black text-sm shadow-xl shadow-brand-dark/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50">إرسال التقرير للمسؤول</button>
                            </form>
                        )}

                        {activeTab === 'profile' && <ProfileManagement user={currentUser!} />}
                    </div>
                </main>
            </div>

            {selectedReport && <ReportDetailModal report={selectedReport} user={currentUser!} viewerRole={Role.EMPLOYEE} onClose={() => setSelectedReport(null)} />}
            {notification && <Toast message={notification.message} onClose={clearNotification} onClick={clearNotification} type={notification.type} />}
            {showLogoutConfirm && <ConfirmModal title="تسجيل الخروج" message="هل أنت متأكد من رغبتك في مغادرة النظام؟" onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} />}
            {showSubmitConfirm && <ConfirmModal title="تأكيد الإرسال" message="سيتم إرسال تقريرك رسمياً للمسؤول للمراجعة. هل تود المتابعة؟" onConfirm={handleFinalSubmit} onCancel={() => setShowSubmitConfirm(false)} />}
        </div>
    );
};

export default EmployeeDashboard;
