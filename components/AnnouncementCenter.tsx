import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Role, User, Announcement } from '../types';
import Avatar from './Avatar';
import XCircleIcon from './icons/XCircleIcon';
import UsersIcon from './icons/UsersIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import EditIcon from './icons/EditIcon';
import TrashIcon from './icons/TrashIcon';

const DetailsModal: React.FC<{
    announcement: Announcement;
    users: User[];
    onClose: () => void;
}> = ({ announcement, users, onClose }) => {
    const employees = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);

    const readUsers = useMemo(() => {
        return announcement.readBy
            .map(entry => {
                const user = users.find(u => u.id === entry.userId);
                return user ? { ...user, readAt: entry.readAt } : null;
            })
            .filter((u): u is User & { readAt: string } => u !== null)
            .sort((a, b) => new Date(a.readAt).getTime() - new Date(b.readAt).getTime());
    }, [announcement.readBy, users]);

    const unreadUsers = useMemo(() => {
        const readUserIds = new Set(announcement.readBy.map(entry => entry.userId));
        return employees.filter(emp => !readUserIds.has(emp.id));
    }, [announcement.readBy, employees]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="relative w-full max-w-2xl p-6 mx-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between pb-4 border-b dark:border-gray-700">
                    <div>
                        <h3 className="text-xl font-bold text-brand-dark dark:text-gray-100">تفاصيل التوجيه</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-300 whitespace-pre-wrap">{announcement.content}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <XCircleIcon className="w-7 h-7" />
                    </button>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <h4 className="flex items-center text-lg font-semibold text-green-700 dark:text-green-400 mb-3">
                           <CheckCircleIcon className="w-5 h-5 ml-2" />
                            اطلعوا عليه ({readUsers.length})
                        </h4>
                        <ul className="space-y-3">
                            {readUsers.map(user => (
                                <li key={user.id} className="flex items-center">
                                    <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                                    <div className="mr-3">
                                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{user.fullName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(user.readAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </li>
                            ))}
                            {readUsers.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">لم يطلع عليه أحد بعد.</p>}
                        </ul>
                    </div>
                     <div>
                        <h4 className="flex items-center text-lg font-semibold text-red-700 dark:text-red-400 mb-3">
                            <UsersIcon className="w-5 h-5 ml-2" />
                            لم يطلعوا عليه بعد ({unreadUsers.length})
                        </h4>
                        <ul className="space-y-3">
                            {unreadUsers.map(user => (
                                <li key={user.id} className="flex items-center">
                                    <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                                    <p className="mr-3 text-sm font-medium text-gray-800 dark:text-gray-200">{user.fullName}</p>
                                </li>
                            ))}
                            {unreadUsers.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">اطلع عليه جميع المنتسبين.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditAnnouncementModal: React.FC<{
    announcement: Announcement;
    onClose: () => void;
    onSave: (announcementId: string, content: string) => Promise<void>;
}> = ({ announcement, onClose, onSave }) => {
    const [content, setContent] = useState(announcement.content);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (content.trim()) {
            setIsSaving(true);
            await onSave(announcement.id, content);
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={onClose}>
            <div className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h2 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4">تعديل التوجيه</h2>
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={5}
                    className="block w-full p-2 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                />
                <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                    <button onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500" disabled={isSaving}>إلغاء</button>
                    <button onClick={handleSave} className="px-4 py-2 text-white bg-brand-light rounded-md hover:bg-brand-dark" disabled={isSaving}>
                        {isSaving ? 'جارِ الحفظ...' : 'حفظ التعديلات'}
                    </button>
                </div>
            </div>
        </div>
    );
};


const AnnouncementCenter: React.FC = () => {
    const { announcements, users, addAnnouncement, updateAnnouncement, deleteAnnouncement } = useData();
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null);
    
    const employees = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);
    const totalEmployees = employees.length;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAnnouncement.trim()) {
            setIsSubmitting(true);
            await addAnnouncement(newAnnouncement);
            setNewAnnouncement('');
            setIsSubmitting(false);
        }
    };
    
    const handleUpdate = async (announcementId: string, content: string) => {
        await updateAnnouncement(announcementId, content);
        setEditingAnnouncement(null);
    };

    const handleDelete = async () => {
        if (deletingAnnouncement) {
            await deleteAnnouncement(deletingAnnouncement.id);
            setDeletingAnnouncement(null);
        }
    };


    return (
        <>
        <div className="space-y-8">
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-brand-dark dark:text-gray-100 mb-4">إرسال توجيه أو تعميم جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="announcement" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            نص الرسالة
                        </label>
                        <textarea
                            id="announcement"
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            rows={4}
                            placeholder="اكتب التوجيه هنا..."
                            className="block w-full p-2 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200"
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 text-sm font-medium text-white bg-brand-light border border-transparent rounded-md shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light disabled:bg-opacity-70 transition-colors"
                        >
                            {isSubmitting ? 'جارِ الإرسال...' : 'إرسال للجميع'}
                        </button>
                    </div>
                </form>
            </div>
            
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                 <h2 className="text-2xl font-semibold text-brand-dark dark:text-gray-100 mb-4">سجل التوجيهات المرسلة</h2>
                 <div className="space-y-4">
                    {announcements.length > 0 ? announcements.map(a => {
                        const readCount = a.readBy.length;
                        const readers = a.readBy
                            .map(entry => users.find(u => u.id === entry.userId))
                            .filter((u): u is User => u !== undefined);

                        let readersSummary: string | null = null;
                        if (readers.length > 0) {
                            const readerNames = readers.map(r => r.fullName.split(' ')[0]);
                            if (readers.length === 1) {
                                readersSummary = `اطلع عليه: ${readerNames[0]}`;
                            } else if (readers.length === 2) {
                                readersSummary = `اطلع عليه: ${readerNames.join(' و ')}`;
                            } else {
                                const remainingCount = readers.length - 2;
                                const otherWord = remainingCount === 1 ? 'آخر' : 'آخرون';
                                readersSummary = `اطلع عليه: ${readerNames.slice(0, 2).join('، ')} و ${remainingCount} ${otherWord}`;
                            }
                        }
                        
                        return (
                            <div key={a.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border dark:border-gray-700">
                                <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(a.date).toLocaleString('ar-EG')}</p>
                                <p className="mt-2 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{a.content}</p>
                                <div className="mt-3 pt-3 border-t dark:border-gray-600 flex justify-between items-center flex-wrap gap-y-2">
                                     <div className="text-sm">
                                        <p className="font-medium text-gray-600 dark:text-gray-300">
                                             الحالة: <span className="font-bold text-brand-dark dark:text-gray-100">{readCount}</span> من <span className="font-bold text-brand-dark dark:text-gray-100">{totalEmployees}</span>
                                        </p>
                                        {readersSummary && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{readersSummary}</p>
                                        )}
                                     </div>
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button 
                                            onClick={() => setSelectedAnnouncement(a)}
                                            className="px-3 py-1 text-sm font-semibold text-brand-light bg-white dark:bg-gray-700 border border-brand-light rounded-full hover:bg-brand-light/10 dark:hover:bg-brand-light/20 transition-colors"
                                        >
                                            عرض التفاصيل
                                        </button>
                                        <button
                                            onClick={() => setEditingAnnouncement(a)}
                                            className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-brand-dark transition-colors"
                                            title="تعديل التوجيه"
                                        >
                                            <EditIcon className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => setDeletingAnnouncement(a)}
                                            className="p-2 text-gray-500 dark:text-gray-400 rounded-full hover:bg-red-100 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors"
                                            title="حذف التوجيه"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-gray-500 dark:text-gray-400">لم يتم إرسال أي توجيهات بعد.</p>
                    )}
                 </div>
            </div>
        </div>
        
        {selectedAnnouncement && (
            <DetailsModal 
                announcement={selectedAnnouncement}
                users={users}
                onClose={() => setSelectedAnnouncement(null)}
            />
        )}
        {editingAnnouncement && (
            <EditAnnouncementModal
                announcement={editingAnnouncement}
                onClose={() => setEditingAnnouncement(null)}
                onSave={handleUpdate}
            />
        )}
        {deletingAnnouncement && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setDeletingAnnouncement(null)}>
                <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                    <h2 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4">تأكيد الحذف</h2>
                    <p className="dark:text-gray-200">هل أنت متأكد من حذف هذا التوجيه؟ لا يمكن التراجع عن هذا الإجراء.</p>
                    <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                        <button onClick={() => setDeletingAnnouncement(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">إلغاء</button>
                        <button onClick={handleDelete} className="px-4 py-2 text-white bg-brand-accent-red rounded-md hover:bg-red-700">تأكيد الحذف</button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
};

export default AnnouncementCenter;