import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Role, User, Announcement } from '../types';
import Avatar from './Avatar';
import XCircleIcon from './icons/XCircleIcon';
import UsersIcon from './icons/UsersIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';

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
                className="relative w-full max-w-2xl p-6 mx-4 bg-white rounded-lg shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-start justify-between pb-4 border-b">
                    <div>
                        <h3 className="text-xl font-bold text-brand-dark">تفاصيل التوجيه</h3>
                        <p className="mt-1 text-sm text-gray-500 whitespace-pre-wrap">{announcement.content}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XCircleIcon className="w-7 h-7" />
                    </button>
                </div>
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div>
                        <h4 className="flex items-center text-lg font-semibold text-green-700 mb-3">
                           <CheckCircleIcon className="w-5 h-5 ml-2" />
                            اطلعوا عليه ({readUsers.length})
                        </h4>
                        <ul className="space-y-3">
                            {readUsers.map(user => (
                                <li key={user.id} className="flex items-center">
                                    <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                                    <div className="mr-3">
                                        <p className="text-sm font-medium text-gray-800">{user.fullName}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(user.readAt).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' })}
                                        </p>
                                    </div>
                                </li>
                            ))}
                            {readUsers.length === 0 && <p className="text-sm text-gray-500">لم يطلع عليه أحد بعد.</p>}
                        </ul>
                    </div>
                     <div>
                        <h4 className="flex items-center text-lg font-semibold text-red-700 mb-3">
                            <UsersIcon className="w-5 h-5 ml-2" />
                            لم يطلعوا عليه بعد ({unreadUsers.length})
                        </h4>
                        <ul className="space-y-3">
                            {unreadUsers.map(user => (
                                <li key={user.id} className="flex items-center">
                                    <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                                    <p className="mr-3 text-sm font-medium text-gray-800">{user.fullName}</p>
                                </li>
                            ))}
                            {unreadUsers.length === 0 && <p className="text-sm text-gray-500">اطلع عليه جميع المنتسبين.</p>}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};


const AnnouncementCenter: React.FC = () => {
    const { announcements, users, addAnnouncement } = useData();
    const [newAnnouncement, setNewAnnouncement] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
    
    const employees = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);
    const totalEmployees = employees.length;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newAnnouncement.trim()) {
            setIsSubmitting(true);
            addAnnouncement(newAnnouncement);
            setNewAnnouncement('');
            setTimeout(() => setIsSubmitting(false), 500);
        }
    };

    return (
        <>
        <div className="space-y-8">
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-brand-dark mb-4">إرسال توجيه أو تعميم جديد</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="announcement" className="block text-sm font-medium text-gray-700 mb-1">
                            نص الرسالة
                        </label>
                        <textarea
                            id="announcement"
                            value={newAnnouncement}
                            onChange={(e) => setNewAnnouncement(e.target.value)}
                            rows={4}
                            placeholder="اكتب التوجيه هنا..."
                            className="block w-full p-2 border-gray-300 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm"
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
            
            <div className="p-6 bg-white rounded-lg shadow-md">
                 <h2 className="text-2xl font-semibold text-brand-dark mb-4">سجل التوجيهات المرسلة</h2>
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
                            <div key={a.id} className="p-4 bg-gray-50 rounded-lg border">
                                <p className="text-sm text-gray-500">{new Date(a.date).toLocaleString('ar-EG')}</p>
                                <p className="mt-2 text-gray-800 whitespace-pre-wrap">{a.content}</p>
                                <div className="mt-3 pt-3 border-t flex justify-between items-center flex-wrap gap-y-2">
                                     <div className="text-sm">
                                        <p className="font-medium text-gray-600">
                                             الحالة: <span className="font-bold text-brand-dark">{readCount}</span> من <span className="font-bold text-brand-dark">{totalEmployees}</span>
                                        </p>
                                        {readersSummary && (
                                            <p className="text-xs text-gray-500 mt-1">{readersSummary}</p>
                                        )}
                                     </div>
                                     <button 
                                        onClick={() => setSelectedAnnouncement(a)}
                                        className="px-3 py-1 text-sm font-semibold text-brand-light bg-white border border-brand-light rounded-full hover:bg-brand-light/10 transition-colors"
                                     >
                                         عرض التفاصيل
                                     </button>
                                </div>
                            </div>
                        )
                    }) : (
                        <p className="text-gray-500">لم يتم إرسال أي توجيهات بعد.</p>
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
        </>
    );
};

export default AnnouncementCenter;