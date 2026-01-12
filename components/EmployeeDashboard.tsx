
import React, { useState, useMemo, useEffect } from 'react';
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
import DocumentTextIcon from './icons/DocumentTextIcon';
import CameraIcon from './icons/CameraIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import XMarkIcon from './icons/XMarkIcon';
import EditIcon from './icons/EditIcon';
import ConfirmModal from './ConfirmModal';

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, directTasks, addReport, saveOrUpdateDraft, deleteReport, notification, clearNotification, isSyncing, refreshData } = useData();
    
    const [activeTab, setActiveTab] = useState('home');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [selectedReport, setSelectedReport] = useState<Report | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

    const [reportForm, setReportForm] = useState({
        tasks: [{ id: Date.now().toString(), text: '' }],
        accomplished: '',
        notAccomplished: '',
        attachments: [] as Attachment[]
    });

    const myReports = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id && r.status === 'submitted')
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser]);

    const myDrafts = useMemo(() => 
        reports.filter(r => r.userId === currentUser?.id && r.status === 'draft')
               .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    , [reports, currentUser]);

    // عداد المهام الجديدة - لحظي تماماً
    const unreadTasksCount = useMemo(() => 
        directTasks.filter(t => t.employeeId === currentUser?.id && t.status === 'pending' && !t.isReadByEmployee).length
    , [directTasks, currentUser]);

    const handleEditDraft = (draft: Report) => {
        setReportForm({
            tasks: draft.tasks.map(t => ({...t})),
            accomplished: draft.accomplished,
            notAccomplished: draft.notAccomplished,
            attachments: draft.attachments || []
        });
        setEditingDraftId(draft.id);
        setActiveTab('new-report');
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        setShowSubmitConfirm(false);
        try {
            if (editingDraftId) await deleteReport(editingDraftId);
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
            setEditingDraftId(null);
            setActiveTab('archive');
        } catch (e) {} finally { setIsSubmitting(false); }
    };

    const NavItem = ({ tab, label, icon, count }: any) => (
        <button
            onClick={() => { setActiveTab(tab); setIsSidebarOpen(false); }}
            className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-all rounded-xl ${activeTab === tab ? 'bg-brand-light text-white shadow-lg' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50'}`}
        >
            <div className="w-6 h-6">{icon}</div>
            <span className="mr-3">{label}</span>
            {count > 0 && <span className="mr-auto bg-brand-accent-red text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">{count}</span>}
        </button>
    );

    return (
        <div className="h-[100dvh] w-full bg-[#fcfdfe] dark:bg-[#0d1117] flex overflow-hidden">
            {isSidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 right-0 z-40 w-72 h-full bg-white dark:bg-gray-900 shadow-2xl transform transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                <div className="flex flex-col h-full border-l dark:border-gray-800">
                    <div className="p-6 border-b dark:border-gray-800 flex flex-col items-center gap-2">
                        <AppLogoIcon className="w-10 h-10" />
                        <h1 className="text-lg font-bold dark:text-gray-100">مهامي اليومية</h1>
                        <button onClick={refreshData} className="p-1 text-brand-light hover:rotate-180 transition-transform duration-500">
                            <ArrowPathIcon className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                    
                    <nav className="flex-grow px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                        <NavItem tab="home" label="الرئيسية" icon={<HomeIcon />} />
                        <NavItem tab="new-report" label="إرسال تقرير" icon={<NewReportIcon />} />
                        <NavItem tab="drafts" label="المسودات" icon={<ClipboardDocumentListIcon />} count={myDrafts.length} />
                        <NavItem tab="tasks" label="المهام الواردة" icon={<InboxIcon />} count={unreadTasksCount} />
                        <NavItem tab="archive" label="الأرشيف" icon={<ArchiveBoxIcon />} />
                        <NavItem tab="profile" label="الملف الشخصي" icon={<UserCircleIcon />} />
                    </nav>
                    
                    <div className="p-4 border-t dark:border-gray-800 space-y-2">
                        <ThemeToggle />
                        <button onClick={() => setShowLogoutConfirm(true)} className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-500 rounded-xl hover:bg-red-50">
                            <LogoutIcon className="w-6 h-6"/>
                            <span className="mr-3">خروج</span>
                        </button>
                    </div>
                </div>
            </aside>
            
            <div className="flex-1 flex flex-col h-full overflow-hidden">
                <header className="flex items-center justify-between p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 md:hidden z-20 sticky top-0">
                    <div className="flex items-center gap-2">
                        <AppLogoIcon className="w-8 h-8" />
                        <h2 className="text-lg font-bold dark:text-gray-100">مهامي</h2>
                    </div>
                    <div className="flex items-center gap-3">
                        {unreadTasksCount > 0 && <span className="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>}
                        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-2xl"><MenuIcon className="w-6 h-6" /></button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar">
                    <div className="container mx-auto max-w-4xl">
                        {activeTab === 'home' && (
                            <div className="space-y-6 animate-fade-in">
                                <div className="bg-gradient-to-br from-brand-light to-brand-dark p-8 rounded-[2.5rem] shadow-2xl text-white text-center relative overflow-hidden">
                                    <SparklesIcon className="w-16 h-16 text-brand-accent-yellow mx-auto mb-4" />
                                    <h3 className="text-3xl font-bold">أهلاً بك، {currentUser?.fullName.split(' ')[0]}</h3>
                                    <p className="mt-2 opacity-90">لديك {unreadTasksCount} مهام جديدة بانتظارك</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tasks' && <DirectTasksView />}
                        {activeTab === 'archive' && (
                            <div className="space-y-4 animate-fade-in">
                                {myReports.map(r => <ReportView key={r.id} report={r} user={currentUser!} viewerRole={Role.EMPLOYEE} onClick={() => setSelectedReport(r)} />)}
                            </div>
                        )}

                        {activeTab === 'new-report' && (
                            <form onSubmit={(e) => { e.preventDefault(); setShowSubmitConfirm(true); }} className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border dark:border-gray-700 space-y-6 animate-fade-in">
                                <h3 className="text-xl font-bold dark:text-white">تقرير عمل جديد</h3>
                                <div className="space-y-3">
                                    {reportForm.tasks.map((task, idx) => (
                                        <div key={task.id} className="flex gap-2">
                                            <textarea 
                                                value={task.text} 
                                                onChange={(e) => setReportForm(p => ({ ...p, tasks: p.tasks.map(t => t.id === task.id ? { ...t, text: e.target.value } : t) }))} 
                                                placeholder={`المهمة ${idx + 1}...`} 
                                                className="flex-1 px-4 py-3 border dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white" 
                                            />
                                            {idx > 0 && <button type="button" onClick={() => setReportForm(p => ({...p, tasks: p.tasks.filter(t => t.id !== task.id)}))} className="p-3 text-red-500"><TrashIcon className="w-5 h-5"/></button>}
                                        </div>
                                    ))}
                                    <button type="button" onClick={() => setReportForm(p => ({...p, tasks: [...p.tasks, {id: Date.now().toString(), text: ''}]}))} className="text-xs font-bold text-brand-light flex items-center gap-1"><PlusIcon className="w-4 h-4"/> إضافة مهمة</button>
                                </div>
                                <textarea placeholder="خلاصة المنجز..." value={reportForm.accomplished} onChange={e => setReportForm(p => ({...p, accomplished: e.target.value}))} className="w-full p-4 border dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700 dark:text-white" rows={3} />
                                <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-brand-light text-white rounded-2xl font-bold shadow-xl active:scale-95 disabled:opacity-50">إرسال التقرير</button>
                            </form>
                        )}

                        {activeTab === 'profile' && <ProfileManagement user={currentUser!} />}
                    </div>
                </main>
            </div>

            {selectedReport && <ReportDetailModal report={selectedReport} user={currentUser!} viewerRole={Role.EMPLOYEE} onClose={() => setSelectedReport(null)} />}
            {notification && <Toast message={notification.message} onClose={clearNotification} onClick={clearNotification} type={notification.type} />}
            {showLogoutConfirm && <ConfirmModal title="خروج" message="هل أنت متأكد؟" onConfirm={logout} onCancel={() => setShowLogoutConfirm(false)} />}
            {showSubmitConfirm && <ConfirmModal title="تأكيد الإرسال" message="سيصل التقرير للمسؤول فوراً." onConfirm={handleFinalSubmit} onCancel={() => setShowSubmitConfirm(false)} />}
        </div>
    );
};

export default EmployeeDashboard;
