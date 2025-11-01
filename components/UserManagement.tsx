import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { User, Role } from '../types';
import PlusIcon from './icons/PlusIcon';
import EditIcon from './icons/EditIcon';
import Avatar from './Avatar';
import TrashIcon from './icons/TrashIcon';
import SignatureIcon from './icons/SignatureIcon';

// Modal Form Component
const UserFormModal: React.FC<{ user?: User; onClose: () => void; onSave: (user: User | Omit<User, 'id'>) => void; }> = ({ user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        badgeNumber: user?.badgeNumber || '',
        phone: user?.phone || '',
        jobTitle: user?.jobTitle || '',
        password: user?.password || '',
        profilePictureUrl: user?.profilePictureUrl || '',
        signatureImageUrl: user?.signatureImageUrl || '',
    });
    const [imagePreview, setImagePreview] = useState<string | null>(user?.profilePictureUrl || null);
    const [signaturePreview, setSignaturePreview] = useState<string | null>(user?.signatureImageUrl || null);
    const [error, setError] = useState('');

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

    const handleSignatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setSignaturePreview(result);
                setFormData(prev => ({ ...prev, signatureImageUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.fullName || !formData.badgeNumber || !formData.phone || !formData.jobTitle || !formData.password) {
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
            <div className="w-full max-w-lg p-6 bg-white rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-brand-dark mb-4">{user ? 'تعديل بيانات المنتسب' : 'إضافة منتسب جديد'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Avatar src={imagePreview || undefined} name={formData.fullName} size={64} />
                        <div className="flex-grow">
                            <label htmlFor="profile-picture-upload" className="block text-sm font-medium text-gray-700">الصورة الشخصية</label>
                            <input 
                                id="profile-picture-upload"
                                type="file" 
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light file:text-white hover:file:bg-brand-dark"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <input name="fullName" value={formData.fullName} onChange={handleChange} placeholder="الاسم الثلاثي" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="الصفة الوظيفية" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        <input name="badgeNumber" value={formData.badgeNumber} onChange={handleChange} placeholder="رقم الباج" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                        <input name="phone" value={formData.phone} onChange={handleChange} placeholder="رقم الهاتف (للدخول)" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <input name="password" value={formData.password} onChange={handleChange} placeholder="كلمة المرور" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                    
                    <div className="pt-2 border-t">
                        <div className="flex flex-col items-center space-y-2">
                            <label htmlFor="signature-upload" className="flex items-center text-sm font-medium text-gray-700 mt-2">
                                <SignatureIcon className="w-4 h-4 ml-2" />
                                توقيع المنتسب
                            </label>
                            {signaturePreview ? (
                                <img src={signaturePreview} alt="Signature Preview" className="h-16 w-auto p-1 border rounded-md bg-white" />
                            ) : (
                                <div className="h-16 w-40 flex items-center justify-center border-2 border-dashed rounded-md text-sm text-gray-400">لا يوجد توقيع</div>
                            )}
                            <input 
                                id="signature-upload"
                                type="file" 
                                accept="image/*"
                                onChange={handleSignatureChange}
                                className="mt-1 block w-full max-w-xs text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-light/20 file:text-brand-dark hover:file:bg-brand-light/30"
                            />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <div className="flex justify-end pt-4 space-x-2 space-x-reverse">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">إلغاء</button>
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

    const handleOpenModal = (user?: User) => {
        setEditingUser(user);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingUser(undefined);
    };

    const handleSaveUser = (user: User | Omit<User, 'id'>) => {
        if ('id' in user) {
            updateUser(user);
        } else {
            addUser(user);
        }
        handleCloseModal();
    };

    const handleDeleteUser = () => {
        if (deletingUser) {
            deleteUser(deletingUser.id);
            setDeletingUser(null);
        }
    };

    return (
        <div className="p-0 sm:p-6 bg-white rounded-lg sm:shadow-md">
            <div className="flex items-center justify-between mb-6 px-4 pt-4 sm:p-0">
                <h2 className="text-2xl font-semibold text-brand-dark">قائمة المنتسبين</h2>
                <button onClick={() => handleOpenModal()} className="flex items-center px-4 py-2 text-sm font-medium text-white bg-brand-light rounded-md hover:bg-brand-dark">
                    <PlusIcon className="w-5 h-5 ml-2" />
                    إضافة منتسب
                </button>
            </div>

            {/* Mobile View - Cards */}
            <div className="space-y-3 md:hidden">
                {employees.map(user => (
                    <div key={user.id} className="p-4 bg-gray-50 rounded-lg border">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <Avatar src={user.profilePictureUrl} name={user.fullName} size={40} />
                                <div>
                                    <p className="font-bold text-brand-dark">{user.fullName}</p>
                                    <p className="text-sm text-gray-600">{user.jobTitle}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 space-x-reverse">
                                <button onClick={() => handleOpenModal(user)} className="p-2 text-brand-light rounded-md hover:bg-gray-200">
                                    <EditIcon className="w-5 h-5"/>
                                </button>
                                <button onClick={() => setDeletingUser(user)} className="p-2 text-red-600 rounded-md hover:bg-red-100">
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                        <div className="mt-3 pt-3 border-t text-sm text-gray-600 space-y-1">
                            <p><strong>رقم الباج:</strong> {user.badgeNumber}</p>
                            <p><strong>رقم الهاتف:</strong> {user.phone}</p>
                        </div>
                    </div>
                ))}
            </div>


            {/* Desktop View - Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-right">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-2 text-sm font-medium text-gray-600">المنتسب</th>
                            <th className="px-4 py-2 text-sm font-medium text-gray-600">الصفة الوظيفية</th>
                            <th className="px-4 py-2 text-sm font-medium text-gray-600">رقم الباج</th>
                            <th className="px-4 py-2 text-sm font-medium text-gray-600">رقم الهاتف</th>
                            <th className="px-4 py-2 text-sm font-medium text-gray-600">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {employees.map(user => (
                            <tr key={user.id}>
                                <td className="px-4 py-3 text-sm text-gray-800">
                                    <div className="flex items-center space-x-3 space-x-reverse">
                                        <Avatar src={user.profilePictureUrl} name={user.fullName} size={32} />
                                        <span>{user.fullName}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.jobTitle}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.badgeNumber}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{user.phone}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    <div className="flex items-center space-x-2 space-x-reverse">
                                        <button onClick={() => handleOpenModal(user)} className="p-1 text-brand-light rounded-md hover:bg-gray-100 hover:text-brand-dark">
                                            <EditIcon className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => setDeletingUser(user)} className="p-1 text-red-600 rounded-md hover:bg-red-50 hover:text-red-800">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {isModalOpen && <UserFormModal user={editingUser} onClose={handleCloseModal} onSave={handleSaveUser} />}

            {deletingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setDeletingUser(null)}>
                    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-brand-dark mb-4">تأكيد الحذف</h2>
                        <p>هل أنت متأكد من حذف المنتسب <span className="font-bold">{deletingUser.fullName}</span>؟</p>
                        <p className="text-sm text-gray-500 mt-1">سيتم حذف جميع التقارير الخاصة به ولا يمكن التراجع عن هذا الإجراء.</p>
                        <div className="flex justify-end pt-4 mt-4 border-t space-x-2 space-x-reverse">
                            <button onClick={() => setDeletingUser(null)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">إلغاء</button>
                            <button onClick={handleDeleteUser} className="px-4 py-2 text-white bg-brand-accent-red rounded-md hover:bg-red-700">تأكيد الحذف</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;