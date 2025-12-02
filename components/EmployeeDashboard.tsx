
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Report, Task, Role, User, Attachment } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import PaperclipIcon from './icons/PaperclipIcon';
import LogoutIcon from './icons/LogoutIcon';
import ReportView from './ReportView';
import NewReportIcon from './icons/NewReportIcon';
import InboxIcon from './icons/InboxIcon';
import OutboxIcon from './icons/OutboxIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import Avatar from './Avatar';
import ProfileManagement from './ProfileManagement';
import UserCircleIcon from './icons/UserCircleIcon';
import ReportDetailModal from './ReportDetailModal';
import Toast from './Toast';
import MenuIcon from './icons/MenuIcon';
import XMarkIcon from './icons/XMarkIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import JobTitleIcon from './icons/JobTitleIcon';
import BadgeNumberIcon from './icons/BadgeNumberIcon';
import HashtagIcon from './icons/HashtagIcon';
import ThemeToggle from './ThemeToggle';
import AppLogoIcon from './icons/AppLogoIcon';
import HomeIcon from './icons/HomeIcon';
import ClipboardDocumentListIcon from './icons/ClipboardDocumentListIcon';
import DirectTasksView from './DirectTasksView';
import ArchiveBoxIcon from './icons/ArchiveBoxIcon';
import ConfirmModal from './ConfirmModal';
import EditIcon from './icons/EditIcon';


interface ReportFormProps {
    user: User;
    onFinish: () => void;
    draftToEdit: Report | null;
}

const ReportForm: React.FC<ReportFormProps> = ({ user, onFinish, draftToEdit }) => {
    const { addReport, saveOrUpdateDraft, updateReport } = useData();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [tasks, setTasks] = useState<Task[]>([{ id: 'task-1', text: '' }]);
    const [accomplished, setAccomplished] = useState('');
    const [notAccomplished, setNotAccomplished] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingDraft, setIsSavingDraft] = useState(false);

    useEffect(() => {
        if (draftToEdit) {
            setDate(draftToEdit.date);
            setTasks(draftToEdit.tasks.length > 0 ? draftToEdit.tasks : [{ id: 'task-1', text: '' }]);
            setAccomplished(draftToEdit.accomplished);
            setNotAccomplished(draftToEdit.notAccomplished);
            setAttachments(draftToEdit.attachments || []);
        } else {
            // Reset form when creating a new report
            setDate(new Date().toISOString().split('T')[0]);
            setTasks([{ id: 'task-1', text: '' }]);
            setAccomplished('');
            setNotAccomplished('');
            setAttachments([]);
        }
    }, [draftToEdit]);


    const handleAddTask = () => {
        setTasks([...tasks, { id: `task-${Date.now()}`, text: '' }]);
    };

    const handleTaskChange = (index: number, value: string) => {
        const newTasks = [...tasks];
        newTasks[index].text = value;
        setTasks(newTasks);
    };

    const handleRemoveTask = (index: number) => {
        const newTasks = tasks.filter((_, i) => i !== index);
        setTasks(newTasks);
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileList = Array.from(e.target.files);
            const newAttachments = await Promise.all(
                // FIX: Explicitly type 'file' as 'File' to resolve type inference issues.
                fileList.map(async (file: File) => ({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: await fileToDataURL(file)
                }))
            );
            setAttachments(prev => [...prev, ...newAttachments]);
        }
    };

     const handleRemoveAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const fileToDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    };

    const collectReportData = (): Partial<Report> => {
        return {
            userId: user.id,
            date,
            day: new Date(date).toLocaleDateString('ar-EG', { weekday: 'long' }),
            tasks: tasks.filter(t => t.text.trim() !== ''),
            accomplished,
            notAccomplished,
            attachments,
        };
    };

    const handleSaveDraft = async () => {
        setIsSavingDraft(true);
        const draftData = collectReportData();
        const draftToSave = { ...draftData, id: draftToEdit?.id };
        await saveOrUpdateDraft(draftToSave);
        setIsSavingDraft(false);
        onFinish();
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setIsSubmitting(true);
        const reportData = collectReportData();

        if (draftToEdit) { // Submitting an existing draft
            const submittedDraft: Report = {
                ...draftToEdit,
                ...reportData,
                status: 'submitted',
            };
            await updateReport(submittedDraft);
        } else { // Submitting a new report
             const newReport: Omit<Report, 'id' | 'sequenceNumber' | 'status'> = {
                ...(reportData as any), // Type assertion as we know it's a new report
            };
            await addReport(newReport);
        }
        
        setIsSubmitting(false);
        onFinish();
    };


    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
            <h3 className="text-2xl font-semibold text-brand-dark dark:text-gray-100 border-b dark:border-gray-700 pb-3">{draftToEdit ? 'تعديل المسودة' : 'تقرير المهام اليومي'}</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <div className="md:col-span-2">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Avatar src={user.profilePictureUrl} name={user.fullName} size={56} />
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الثلاثي</label>
                            <input type="text" readOnly value={user.fullName} className="block w-full mt-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm dark:text-gray-200" />
                        </div>
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصفة الوظيفية</label>
                    <div className="relative mt-1">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <JobTitleIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" readOnly value={user.jobTitle} className="w-full pr-10 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm dark:text-gray-200" />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الباج</label>
                     <div className="relative mt-1">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <BadgeNumberIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" readOnly value={user.badgeNumber} className="w-full pr-10 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm dark:text-gray-200" />
                    </div>
                </div>
                <div>
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">التاريخ</label>
                    <input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم التقرير</label>
                     <div className="relative mt-1">
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <HashtagIcon className="w-5 h-5 text-gray-400" />
                        </div>
                        <input type="text" readOnly value={draftToEdit ? draftToEdit.sequenceNumber || '-' : 'سيتم تعيينه عند الإرسال'} className="w-full pr-10 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm dark:text-gray-200" />
                    </div>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المهام</label>
                {tasks.map((task, index) => (
                    <div key={task.id} className="flex items-center mt-2 space-x-2 space-x-reverse">
                        <input type="text" placeholder={`المهمة ${index + 1}`} value={task.text} onChange={(e) => handleTaskChange(index, e.target.value)} className="block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200" />
                        {tasks.length > 1 && <button type="button" onClick={() => handleRemoveTask(index)} className="p-2 text-red-600 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20"><TrashIcon className="w-5 h-5" /></button>}
                    </div>
                ))}
                 <button type="button" onClick={handleAddTask} className="flex items-center mt-2 text-sm font-medium text-brand-light hover:text-brand-dark dark:hover:text-cyan-300">
                    <PlusIcon className="w-5 h-5 ml-1" />
                    إضافة مهمة أخرى
                </button>
            </div>
            
            <div>
                 <label htmlFor="accomplished" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ما تم إنجازه</label>
                 <textarea id="accomplished" value={accomplished} onChange={e => setAccomplished(e.target.value)} rows={3} className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"></textarea>
            </div>
            
            <div>
                 <label htmlFor="notAccomplished" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ما لم يتم إنجازه</label>
                 <textarea id="notAccomplished" value={notAccomplished} onChange={e => setNotAccomplished(e.target.value)} rows={3} className="block w-full mt-1 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"></textarea>
            </div>

            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">المرفقات</label>
                 <div className="flex items-center justify-center w-full mt-1">
                    <label className="flex flex-col w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500">
                        <div className="flex flex-col items-center justify-center pt-7">
                            <PaperclipIcon className="w-8 h-8 text-gray-400"/>
                            <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">اختر ملفات (صور, PDF, ...)</p>
                        </div>
                        <input type="file" multiple onChange={handleFileChange} className="opacity-0" />
                    </label>
                 </div>
                 {attachments.length > 0 && (
                    <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <p>الملفات المختارة:</p>
                        <ul className="list-disc pr-5">{attachments.map((file, i) => (
                             <li key={i} className="flex items-center justify-between">
                                <span>{file.name}</span>
                                <button type="button" onClick={() => handleRemoveAttachment(i)} className="p-1 text-red-500 hover:text-red-700">
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </li>
                        ))}</ul>
                    </div>
                 )}
            </div>

            <div className="pt-4 border-t dark:border-gray-700 flex flex-col sm:flex-row gap-2">
                 <button type="button" onClick={handleSaveDraft} className="w-full px-4 py-2 text-sm font-medium text-brand-dark dark:text-gray-100 bg-gray-200 dark:bg-gray-600 border border-transparent rounded-md shadow-sm hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 disabled:bg-opacity-70 transition-colors" disabled={isSavingDraft || isSubmitting}>
                    {isSavingDraft ? 'جارِ الحفظ...' : 'حفظ كمسودة'}
                 </button>
                 <button type="submit" className="w-full px-4 py-2 text-sm font-medium text-white bg-brand-light border border-transparent rounded-md shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light disabled:bg-opacity-70 transition-colors" disabled={isSubmitting || isSavingDraft}>
                    {isSubmitting ? 'جارِ الإرسال...' : 'إرسال التقرير'}
                 </button>
            </div>

        </form>
    );
};

const DraftView: React.FC<{
    draft: Report;
    onEdit: (draft: Report) => void;
    onDelete: (draft: Report) => void;
}> = ({ draft, onEdit, onDelete }) => {
    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
                <p className="font-semibold text-brand-dark dark:text-gray-100">مسودة بتاريخ: {draft.date}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {draft.tasks.length > 0 ? `${draft.tasks.length} مهام` : 'لا توجد مهام'}
                </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
                <button
                    onClick={() => onEdit(draft)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-brand-light rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="تعديل المسودة"
                >
                    <EditIcon className="w-5 h-5" />
                </button>
                <button
                    onClick={() => onDelete(draft)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                    title="حذف المسودة"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};


const WelcomeView: React.FC<{ user: User; onStart: () => void }> = ({ user, onStart }) => {
    return (
        <div className="flex items-center justify-center h-full">
            <div className="text-center p-8 md:p-12 bg-gradient-to-br from-brand-dark to-[#3a7c93] rounded-2xl shadow-2xl border border-brand-light/50 max-w-2xl mx-auto animate-fade-in-right">
                <AppLogoIcon className="w-24 h-24 mx-auto mb-4 text-white" />
                <h2 className="text-3xl font-bold text-white">
                    مرحباً, {user.fullName.split(' ')[0]}
                </h2>
                <h3 className="mt-2 text-xl font-semibold text-gray-200">
                    لوحة مهامك…
                </h3>
                <p className="mt-4 text-md text-gray-300">
                    مساحة تبرز فيها جهدك واحترافك
                </p>
                <button
                    onClick={onStart}
                    className="mt-8 px-8 py-3 text-lg font-bold text-brand-dark bg-brand-accent-yellow border border-transparent rounded-md group hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-brand-dark focus:ring-brand-accent-yellow transition-transform transform hover:scale-105"
                >
                    إنشاء تقرير جديد
                </button>
            </div>
        </div>
    );
};

const EmployeeDashboard: React.FC = () => {
    const { currentUser, logout } = useAuth();
    const { reports, announcements, markAnnouncementAsRead, directTasks, deleteReport, isCloud } = useData();
    const [activeTab, setActiveTab] = useState('welcome');
    const [viewingReport, setViewingReport] = useState<Report | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [editingDraft, setEditingDraft] = useState<Report | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [draftToDelete, setDraftToDelete] = useState<Report | null>(null);
    
    if (!currentUser) return null;

    const myReports = useMemo(() => reports.filter(r => r.userId === currentUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [reports, currentUser.id]);
    const submittedReports = useMemo(() => myReports.filter(r => r.status === 'submitted'), [myReports]);
    const myDrafts = useMemo(() => myReports.filter(r => r.status === 'draft'), [myReports]);
    const inboxReports = useMemo(() => submittedReports.filter(r => r.managerComment), [submittedReports]);
    const unreadCommentsCount = useMemo(() => inboxReports.filter(r => !r.isCommentReadByEmployee).length, [inboxReports]);
    const unreadAnnouncementsCount = useMemo(() => announcements.filter(a => !a.readBy.some(r => r.userId === currentUser.id)).length, [announcements, currentUser.id]);
    const myDirectTasks = useMemo(() => directTasks.filter(t => t.employeeId === currentUser.id), [directTasks, currentUser.id]);
    const unreadDirectTasksCount = useMemo(() => myDirectTasks.filter(t => t.status === 'pending').length, [myDirectTasks]);

    // Real-time notification listener
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === 'comment_notification' && event.newValue && currentUser) {
                try {
                    const payload = JSON.parse(event.newValue);
                    if (payload.userId === currentUser.id) {
                        setNotification(payload.message || 'لديك تعليق جديد من المسؤول على أحد تقاريرك.');
                    }
                } catch (e) {
                    console.error("Failed to parse notification from storage", e);
                }
            }
            if (event.key === 'task_notification' && event.newValue && currentUser) {
                 try {
                    const payload = JSON.parse(event.newValue);
                    if (payload.userId === currentUser.id) {
                        setNotification(payload.message || 'لديك مهمة جديدة من المسؤول.');
                    }
                } catch (e) {
                    console.error("Failed to parse notification from storage", e);
                }
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [currentUser]);
    
    const pageTitles: { [key: string]: string } = {
        welcome: 'الرئيسية',
        new: editingDraft ? 'تعديل مسودة' : 'تقرير جديد',
        submitted: 'التقارير الصادرة',
        inbox: 'البريد الوارد',
        drafts: 'المسودات',
        directTasks: 'المهام الواردة',
        announcements: 'التوجيهات والتعاميم',
        profile: 'الملف الشخصي',
    };

     const handleReportFormFinish = useCallback(() => {
        setEditingDraft(null);
        setActiveTab('submitted');
    }, []);

    const handleEditDraft = useCallback((draft: Report) => {
        setEditingDraft(draft);
        setActiveTab('new');
    }, []);
    
    const handleDeleteDraft = useCallback(async () => {
        if (draftToDelete) {
            await deleteReport(draftToDelete.id);
            setDraftToDelete(null);
        }
    }, [draftToDelete, deleteReport]);

    const renderContent = () => {
        switch(activeTab) {
            case 'welcome':
                return <WelcomeView user={currentUser} onStart={() => { setEditingDraft(null); setActiveTab('new'); }} />;
            case 'submitted':
                return (
                    <div className="space-y-4">
                        {submittedReports.length > 0 ? submittedReports.map(report => (
                            <ReportView key={report.id} report={report} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setViewingReport(report)} />
                        )) : <p className="text-gray-500 dark:text-gray-400">لم تقم بإرسال أي تقارير بعد.</p>}
                    </div>
                );
            case 'inbox':
                 return (
                    <div className="space-y-4">
                        {inboxReports.length > 0 ? inboxReports.map(report => (
                            <ReportView key={report.id} report={report} user={currentUser} viewerRole={Role.EMPLOYEE} onClick={() => setViewingReport(report)} />
                        )) : <p className="text-gray-500 dark:text-gray-400">لا توجد لديك أي رسائل في البريد الوارد.</p>}
                    </div>
                );
            case 'drafts':
                return (
                    <div className="space-y-4">
                        {myDrafts.length > 0 ? myDrafts.map(draft => (
                            <DraftView key={draft.id} draft={draft} onEdit={handleEditDraft} onDelete={setDraftToDelete} />
                        )) : <p className="text-gray-500 dark:text-gray-400">لا توجد لديك أي مسودات محفوظة.</p>}
                    </div>
                );
            case 'directTasks':
                return <DirectTasksView />;
            case 'announcements':
                return (
                    <div className="space-y-4">
                        {announcements.length > 0 ? announcements.map(a => {
                            const readEntry = a.readBy.find(r => r.userId === currentUser.id);

                            return (
                                <div key={a.id} className="p-4 bg-blue-50 dark:bg-gray-800 border-r-4 border-brand-light rounded-md shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(a.date).toLocaleString('ar-EG')}</p>
                                            <p className="mt-2 text-gray-800 dark:text-gray-200">{a.content}</p>
                                        </div>
                                        {!readEntry && (
                                            <button
                                                onClick={() => markAnnouncementAsRead(a.id, currentUser.id)}
                                                className="px-3 py-1 text-sm font-semibold text-brand-light bg-white dark:bg-gray-700 border border-brand-light rounded-full hover:bg-brand-light/10 dark:hover:bg-brand-light/20 transition-colors shrink-0"
                                            >
                                                تم الاطلاع
                                            </button>
                                        )}
                                    </div>
                                    {readEntry && (
                                        <div className="mt-3 pt-2 border-t border-brand-light/20 text-right">
                                            <p className="flex items-center justify-end text-xs text-green-700 dark:text-green-400 font-medium">
                                                <CheckCircleIcon className="w-4 h-4 ml-1" />
                                                <span>تم الاطلاع عليه في: {new Date(readEntry.readAt).toLocaleString('ar-EG')}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )
                        }) : <p className="text-gray-500 dark:text-gray-400">لا توجد توجيهات حالياً.</p>}
                    </div>
                );
            case 'profile':
                return <ProfileManagement user={currentUser} />;
            default: // 'new' tab
                return <ReportForm user={currentUser} onFinish={handleReportFormFinish} draftToEdit={editingDraft} />;
        }
    };

    const NavItem: React.FC<{tabName: string; label: string; icon: React.ReactNode; count?: number}> = ({tabName, label, icon, count}) => {
        const isActive = activeTab === tabName;
        return (
             <button
                onClick={() => {
                    if (tabName === 'new') {
                        setEditingDraft(null); // Always start fresh from sidebar
                    }
                    setActiveTab(tabName);
                    if (window.innerWidth < 768) {
                        setIsSidebarOpen(false);
                    }
                }}
                className={`flex items-center w-full px-3 py-3 text-md transition-colors rounded-lg ${isActive ? 'bg-brand-light/10 dark:bg-brand-light/20 text-brand-dark dark:text-gray-100 font-bold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
                {icon}
                <span className="mr-3">{label}</span>
                {count !== undefined && count > 0 ? <span className="flex items-center justify-center w-5 h-5 mr-auto text-xs font-bold text-white bg-brand-accent-red rounded-full">{count}</span> : null}
            </button>
        )
    }

    const SidebarContent = () => (
        <>
            <div className="flex items-center justify-center p-4 border-b dark:border-gray-700">
                <AppLogoIcon className="w-10 h-10 text-brand-dark dark:text-gray-100" />
                <h1 className="mr-2 text-xl font-bold text-brand-dark dark:text-gray-100">المهام اليومية</h1>
            </div>
            <div className="flex flex-col items-center p-4 mt-4 space-y-2 border-b dark:border-gray-700">
                <Avatar src={currentUser.profilePictureUrl} name={currentUser.fullName} size={64} />
                <span className="font-medium text-gray-700 dark:text-gray-200 text-center">مرحباً, {currentUser.fullName.split(' ')[0]}</span>
                {/* Connection Status Indicator */}
                <span className={`px-2 py-0.5 text-xs rounded-full flex items-center ${isCloud ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'}`}>
                    <span className={`w-2 h-2 rounded-full mr-1.5 ${isCloud ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                    {isCloud ? 'متصل (سحابي)' : 'محلي (Offline)'}
                </span>
            </div>
            <nav className="flex-grow px-2 py-4 space-y-1">
                <NavItem tabName='welcome' label='الرئيسية' icon={<HomeIcon className="w-6 h-6"/>} />
                <NavItem tabName='new' label='تقرير جديد' icon={<NewReportIcon className="w-6 h-6"/>} />
                <NavItem tabName='drafts' label='المسودات' icon={<ArchiveBoxIcon className="w-6 h-6"/>} count={myDrafts.length}/>
                <NavItem tabName='submitted' label='صادر' icon={<OutboxIcon className="w-6 h-6"/>} />
                <NavItem tabName='inbox' label='الوارد' icon={<InboxIcon className="w-6 h-6"/>} count={unreadCommentsCount}/>
                <NavItem tabName='directTasks' label='المهام الواردة' icon={<ClipboardDocumentListIcon className="w-6 h-6"/>} count={unreadDirectTasksCount}/>
                <NavItem tabName='announcements' label='التوجيهات' icon={<MegaphoneIcon className="w-6 h-6"/>} count={unreadAnnouncementsCount}/>
                <NavItem tabName='profile' label='الملف الشخصي' icon={<UserCircleIcon className="w-6 h-6"/>} />
            </nav>
            <div className="px-2 py-4 mt-auto border-t dark:border-gray-700">
                 <ThemeToggle />
                 <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="flex items-center w-full px-3 py-3 mt-2 text-md transition-colors rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                    <LogoutIcon className="w-6 h-6"/>
                    <span className="mr-3">تسجيل الخروج</span>
                </button>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
             {isSidebarOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                ></div>
            )}
            <aside className={`fixed inset-y-0 right-0 z-40 flex flex-col w-64 bg-white dark:bg-gray-800 shadow-lg transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}>
                <SidebarContent />
            </aside>

            <div className="flex flex-col flex-1 md:mr-64">
                <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-md md:hidden">
                    <div className="flex items-center">
                        <AppLogoIcon className="w-8 h-8 ml-3 text-brand-dark dark:text-gray-100" />
                        <h1 className="text-xl font-bold text-brand-dark dark:text-gray-100">{pageTitles[activeTab]}</h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(p => !p)}>
                        {isSidebarOpen ? <XMarkIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" /> : <MenuIcon className="w-6 h-6 text-gray-800 dark:text-gray-200" />}
                    </button>
                </header>

                <main className="container px-4 py-8 mx-auto flex-grow flex flex-col">
                     <div className="hidden md:block mb-6">
                        <div className="flex justify-between items-center">
                            <h1 className="text-3xl font-bold text-brand-dark dark:text-gray-100">{pageTitles[activeTab]}</h1>
                             <span className={`md:hidden px-2 py-0.5 text-xs rounded-full flex items-center ${isCloud ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                <span className={`w-2 h-2 rounded-full mr-1.5 ${isCloud ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                                {isCloud ? 'متصل' : 'محلي'}
                            </span>
                        </div>
                    </div>
                    <div className="flex-grow">
                        {renderContent()}
                    </div>
                </main>
                
                <footer className="py-4 mt-auto text-sm text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
                    <p>جميع الحقوق محفوظة 2025م</p>
                    <p>حسين كاظم</p>
                </footer>
            </div>

            {notification && (
                <Toast
                    message={notification}
                    onClose={() => setNotification(null)}
                    onClick={() => {
                        if (notification.includes('مهمة')) {
                             setActiveTab('directTasks');
                        } else {
                             setActiveTab('inbox');
                        }
                        setNotification(null);
                    }}
                />
            )}
            {viewingReport && (
                <ReportDetailModal
                    report={viewingReport}
                    user={currentUser}
                    viewerRole={Role.EMPLOYEE}
                    onClose={() => setViewingReport(null)}
                />
            )}
            {showLogoutConfirm && (
                <ConfirmModal
                    title="تأكيد تسجيل الخروج"
                    message="هل أنت متأكد من رغبتك في تسجيل الخروج؟"
                    onConfirm={logout}
                    onCancel={() => setShowLogoutConfirm(false)}
                    confirmText="خروج"
                />
            )}
            {draftToDelete && (
                 <ConfirmModal
                    title="تأكيد الحذف"
                    message={`هل أنت متأكد من حذف هذه المسودة بتاريخ ${draftToDelete.date}؟`}
                    onConfirm={handleDeleteDraft}
                    onCancel={() => setDraftToDelete(null)}
                    confirmText="حذف"
                    confirmButtonClass="bg-brand-accent-red hover:bg-red-700"
                />
            )}
        </div>
    );
};

export default EmployeeDashboard;
