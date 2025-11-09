import React, { useState, useRef, useCallback } from 'react';
import { useData } from '../context/DataContext';
import { User, Role } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import Avatar from './Avatar';
import TrashIcon from './icons/TrashIcon';
import SignatureIcon from './icons/SignatureIcon';
import SignaturePad, { SignaturePadRef } from './SignaturePad';
import SignaturePreview from './SignaturePreview';
import UploadIcon from './icons/UploadIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

// Modal Form Component
const UserFormModal: React.FC<{ user?: User; onClose: () => void; onSave: (user: User | Omit<User, 'id'>) => void; }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        badgeNumber: user?.badgeNumber || '',
        username: user?.username || '',
        jobTitle: user?.jobTitle || '',
        password: user?.password || '',
        profilePictureUrl: user?.profilePictureUrl || '',
        signatureData: user?.signatureData,
        signatureImageUrl: user?.signatureImageUrl,
    });
    const [imagePreview, setImagePreview] = useState<string | null>(user?.profilePictureUrl || null);
    const [error, setError] = useState('');
    const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
    const [showPassword, setShowPassword] = useState(false);
    const signaturePadRef = useRef<SignaturePadRef>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    
    const handleSignatureImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setFormData(prev => ({ 
                    ...prev, 
                    signatureImageUrl: result,
                    signatureData: undefined // Clear the other type
                }));
                 if (signaturePadRef.current) {
                    signaturePadRef.current.clearSignature();
                }
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleSaveSignatureFromPad = useCallback(() => {
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
            const data = signaturePadRef.current.getSignatureData();
            setFormData(prev => ({ 
                ...prev, 
                signatureData: data,
                signatureImageUrl: undefined // Clear the other type
            }));
        }
    }, []);

    const handleClearSignature = useCallback(() => {
        if (signaturePadRef.current) {
            signaturePadRef.current.clearSignature();
        }
        setFormData(prev => ({ 
            ...prev, 
            signatureData: undefined,
            signatureImageUrl: undefined
        }));
    }, []);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.badgeNumber || !formData.username || !formData.jobTitle || !formData.password) {
            setError('الرجاء تعبئة جميع الحقول.');
            return;
        }
        
        if (user) {
            onSave({ ...user, ...formData });
        } else {
            onSave({ ...formData, role: Role.EMPLOYEE });
        }
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
                    
                    <div className="pt-4 border-t dark:border-gray-700">
                        <h4 className="flex items-center text-md font-semibold text-brand-dark dark:text-gray-100 mb-2">
                            <SignatureIcon className="w-5 h-5 ml-2" />
                            <span>توقيع المنتسب</span>
                        </h4>
                        <div className="flex space-x-2 space-x-reverse border-b dark:border-gray-700 mb-2">
                            <button type="button" onClick={() => setSignatureMode('draw')} className={`px-3 py-2 text-sm ${signatureMode === 'draw' ? 'border-b-2 border-brand-light text-brand-dark dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>رسم</button>
                            <button type="button" onClick={() => setSignatureMode('upload')} className={`px-3 py-2 text-sm ${signatureMode === 'upload' ? 'border-b-2 border-brand-light text-brand-dark dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}>رفع صورة</button>
                        </div>
                        {signatureMode === 'draw' ? (
                            <SignaturePad ref={signaturePadRef} onEnd={handleSaveSignatureFromPad} onClear={handleClearSignature} />
                        ) : (
                            <div className="mt-2">
                                <label htmlFor="sig-upload" className="flex items-center justify-center w-full px-4 py-6 bg-gray-50 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600">
                                    <div className="text-center">
                                        <UploadIcon className="w-8 h-8 mx-auto text-gray-400"/>
                                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">اختر صورة توقيع</p>
                                    </div>
                                    <input id="sig-upload" type="file" className="hidden" onChange={handleSignatureImageUpload} accept="image/*"/>
                                </label>
                            </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            التوقيع الحالي: 
                            {formData.signatureImageUrl && <span className="font-semibold"> صورة مرفوعة</span>}
                            {formData.signatureData && <span className="font-semibold"> توقيع مرسوم</span>}
                            {!formData.signatureImageUrl && !formData.signatureData && <span className="font-semibold"> لا يوجد</span>}
                        </p>
                         {(formData.signatureImageUrl || (formData.signatureData && formData.signatureData.length > 0)) && (
                            <div className="mt-2 p-2 border dark:border-gray-600 rounded-md">
                                <p className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">معاينة:</p>
                                 <div className="h-24 w-full bg-white flex items-center justify-center rounded">
                                    {formData.signatureImageUrl ? (
                                        <img src={formData.signatureImageUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                                    ) : (
                                        <SignaturePreview data={formData.signatureData} className="h-full w-full border-none" />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}
                    <div className="flex justify-end pt-4 mt-4 border-t dark:border-gray-700 space-x-2 space-x-reverse">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500">إلغاء</button>
                        <button type="submit" className="px-4 py-2 text-white bg-brand-light rounded-md hover:bg-brand-dark">حفظ</button>
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

    const handleSaveUser = (userData: User | Omit<User, 'id'>) => {
        if ('id' in userData) {
            updateUser(userData as User);
        } else {
            addUser(userData as Omit<User, 'id'>);
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

    const handleDelete = () => {
        if (deletingUser) {
            deleteUser(deletingUser.id);
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
             <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الاسم</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الصفة الوظيفية</th>
                            <th scope="col" className="relative px-6 py-3">
                                <span className="sr-only">تعديل</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {employees.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                                        <div className="mr-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.fullName}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.jobTitle}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                        <button onClick={() => openEditModal(user)} className="p-2 text-gray-400 hover:text-brand-light rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"><EditIcon className="w-5 h-5"/></button>
                                        <button onClick={() => confirmDelete(user)} className="p-2 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
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
