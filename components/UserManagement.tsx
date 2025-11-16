import React, { useState, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { User, Role } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import Avatar from './Avatar';
import TrashIcon from './icons/TrashIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

const UNITS = ['وحدة التمكين الفني', 'وحدة التنسيق الفني'];

// Modal Form Component
const UserFormModal: React.FC<{ user?: User; onClose: () => void; onSave: (user: User | Omit<User, 'id'>) => Promise<void>; }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        badgeNumber: user?.badgeNumber || '',
        username: user?.username || '',
        jobTitle: user?.jobTitle || '',
        password: user?.password || '',
        profilePictureUrl: user?.profilePictureUrl || '',
        unit: user?.unit || '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(user?.profilePictureUrl || null);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                setFormData(prev => ({ ...prev, profilePictureUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.badgeNumber || !formData.username || !formData.jobTitle || !formData.password) {
            setError('الرجاء تعبئة جميع الحقول.');
            return;
        }
        
        setIsSaving(true);
        if (user) {
            await onSave({ ...user, ...formData });
        } else {
            await onSave({ ...formData, role: Role.EMPLOYEE });
        }
        setIsSaving(false);
    };
    
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-lg p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4">{user ? 'تعديل بيانات المنتسب' : 'إضافة منتسب جديد'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Avatar src={imagePreview || undefined} name={formData.fullName} size={64} />
                        <div className="flex-grow">
                            <label htmlFor="profile-picture-upload" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصورة الشخصية</label>
                            <input 
                                id="profile-picture-upload"
                                type="file" 
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="mt-1 block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-white hover:file:bg-brand-dark"
                            />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الثلاثي</label>
                        <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200" required />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصفة الوظيفية</label>
                            <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200" required />
                        </div>
                        <div>
                            <label htmlFor="badgeNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الباج</label>
                            <input type="text" name="badgeNumber" id="badgeNumber" value={formData.badgeNumber} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200" required />
                        </div>
                    </div>
                     <div>
                        <label htmlFor="unit" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الوحدة التنظيمية</label>
                        <select name="unit" id="unit" value={formData.unit} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200">
                            <option value="">غير معين</option>
                            {UNITS.map(unit => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                     </div>
                     <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                         <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المستخدم</label>
                            <input type="text" name="username" id="username" value={formData.username} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200" required />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
                            <div className="relative mt-1">
                                <input 
                                    type={showPassword ? 'text' : 'password'}
                                    name="password" 
                                    id="password" 
                                    value={formData.password} 
                                    onChange={handleChange} 
                                    className="block w-full px-3 py-2 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200" 
                                    required 
                                />
                                <button 
                                    type="button" 
                                    onClick={() => setShowPassword(!showPassword)} 
                                    className="absolute inset-y-0 left-0 flex items-center pl-3"
                                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                >
                                    {showPassword ? (
                                        <EyeSlashIcon className="w-5 h-5 text-gray-400" />
                                    ) : (
                                        <EyeIcon className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500" disabled={isSaving}>إلغاء</button>
                        <button type="submit" className="px-4 py-2 text-white bg-brand-light rounded-md hover:bg-brand-dark disabled:bg-opacity-50" disabled={isSaving}>
                            {isSaving ? 'جارِ الحفظ...' : 'حفظ'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const UserManagement: React.FC = () => {
    const { users, addUser, updateUser, deleteUser } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | undefined>(undefined);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const employees = users.filter(u => u.role === Role.EMPLOYEE);

    const handleSaveUser = async (userData: User | Omit<User, 'id'>) => {
        if ('id' in userData) {
            await updateUser(userData as User);
        } else {
            await addUser(userData as Omit<User, 'id'>);
        }
        setIsModalOpen(false);
        setEditingUser(undefined);
    };

    const openAddModal = () => {
        setEditingUser(undefined);
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };
    
    const confirmDelete = (user: User) => {
        setDeletingUser(user);
    };

    const handleDelete = async () => {
        if (deletingUser) {
            await deleteUser(deletingUser.id);
            setDeletingUser(null);
        }
    };


    return (
        <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-semibold text-brand-dark dark:text-gray-100">قائمة المنتسبين</h2>
                <button
                    onClick={openAddModal}
                    className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-light border border-transparent rounded-md shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light"
                >
                    <PlusIcon className="w-5 h-5 ml-2" />
                    إضافة منتسب
                </button>
            </div>
             <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {employees.length > 0 ? employees.map(user => (
                    <div key={user.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5 flex flex-col border border-gray-200 dark:border-gray-700 hover:border-brand-light transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4 space-x-reverse">
                                <Avatar src={user.profilePictureUrl} name={user.fullName} size={48} />
                                <div>
                                    <p className="font-bold text-lg text-brand-dark dark:text-gray-100">{user.fullName}</p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{user.jobTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 space-x-reverse shrink-0">
                                <button onClick={() => openEditModal(user)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-brand-light rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors" title="تعديل">
                                    <EditIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => confirmDelete(user)} className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors" title="حذف">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                            <p className="text-sm flex items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 w-20 shrink-0">الوحدة:</span>
                                <span className="mr-2 text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs">{user.unit || 'غير معين'}</span>
                            </p>
                            <p className="text-sm flex items-center">
                                <span className="font-semibold text-gray-700 dark:text-gray-300 w-20 shrink-0">رقم الباج:</span>
                                <span className="mr-2 text-gray-600 dark:text-gray-400">{user.badgeNumber}</span>
                            </p>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-1 sm:col-span-2 xl:col-span-3 text-center py-10 px-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                        <p className="text-gray-500 dark:text-gray-400">
                            لا يوجد منتسبون مضافون حالياً.
                        </p>
                    </div>
                )}
            </div>
            {isModalOpen && <UserFormModal user={editingUser} onClose={() => setIsModalOpen(false)} onSave={handleSaveUser} />}
             {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setDeletingUser(null)}>
                    <div className="w-full max-w-md p-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4">تأكيد الحذف</h2>
                        <p className="dark:text-gray-200">هل أنت متأكد من حذف حساب <span className="font-bold">{deletingUser.fullName}</span>؟ سيتم حذف جميع تقاريره وبياناته بشكل دائم.</p>
                        <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                            <button onClick={() => setDeletingUser(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">إلغاء</button>
                            <button onClick={handleDelete} className="px-4 py-2 text-white bg-brand-accent-red rounded-md hover:bg-red-700">تأكيد الحذف</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;