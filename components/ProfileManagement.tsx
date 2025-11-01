import React, { useState, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { User } from '../types';
import Avatar from './Avatar';
import LockIcon from './icons/LockIcon';

const ProfileManagement: React.FC<{ user: User }> = ({ user }) => {
    const { updateUser } = useData();

    const [formData, setFormData] = useState({
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        badgeNumber: user.badgeNumber,
        phone: user.phone,
        profilePictureUrl: user.profilePictureUrl || '',
    });

    const [imagePreview, setImagePreview] = useState<string | null>(user.profilePictureUrl || null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    
    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    }, []);

    const isProfileChanged = useMemo(() => {
        return (
            formData.fullName !== user.fullName ||
            formData.jobTitle !== user.jobTitle ||
            formData.badgeNumber !== user.badgeNumber ||
            formData.phone !== user.phone ||
            formData.profilePictureUrl !== (user.profilePictureUrl || '')
        );
    }, [formData, user]);


    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage('');

        setTimeout(() => {
            const updatedUser = { ...user, ...formData };
            updateUser(updatedUser);
            setIsSaving(false);
            setSuccessMessage('تم تحديث الملف الشخصي بنجاح!');
            setTimeout(() => setSuccessMessage(''), 3000);
        }, 1000);
    }, [user, formData, updateUser]);

    const handlePasswordSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');
        
        if (user.password !== currentPassword) {
            setPasswordError('كلمة المرور الحالية غير صحيحة.');
            return;
        }
        if (newPassword.length < 4) {
             setPasswordError('كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('كلمتا المرور الجديدتان غير متطابقتين.');
            return;
        }

        setIsSavingPassword(true);
        setTimeout(() => {
            updateUser({ ...user, password: newPassword });
            setIsSavingPassword(false);
            setPasswordSuccess('تم تغيير كلمة المرور بنجاح!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => setPasswordSuccess(''), 3000);
        }, 1000);

    }, [user, currentPassword, newPassword, confirmPassword, updateUser]);


    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-brand-dark border-b pb-3 mb-6">الملف الشخصي</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col items-center space-y-4">
                    <Avatar src={imagePreview || undefined} name={formData.fullName} size={128} />
                    <div>
                        <label htmlFor="profile-picture-upload" className="cursor-pointer px-4 py-2 text-sm font-medium text-white bg-brand-light border border-transparent rounded-md shadow-sm hover:bg-brand-dark transition-colors">
                            تغيير الصورة
                        </label>
                        <input 
                            id="profile-picture-upload"
                            type="file" 
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">الاسم الثلاثي</label>
                        <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">الصفة الوظيفية</label>
                        <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="badgeNumber" className="block text-sm font-medium text-gray-700">رقم الباج</label>
                        <input type="text" name="badgeNumber" id="badgeNumber" value={formData.badgeNumber} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm" />
                    </div>
                     <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">رقم الهاتف</label>
                        <input type="text" name="phone" id="phone" value={formData.phone} onChange={handleDataChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm" />
                    </div>
                </div>

                <div className="pt-4 border-t flex items-center justify-end">
                    {successMessage && <p className="text-green-600 text-sm mr-4">{successMessage}</p>}
                    <button
                        type="submit"
                        disabled={isSaving || !isProfileChanged}
                        className="px-6 py-2 text-sm font-medium text-white bg-brand-light border border-transparent rounded-md shadow-sm hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-light disabled:bg-opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSaving ? 'جارِ الحفظ...' : 'حفظ التعديلات'}
                    </button>
                </div>
            </form>

            <div className="pt-6 mt-6 border-t">
                <h4 className="text-xl font-semibold text-brand-dark mb-4">تغيير كلمة المرور</h4>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">كلمة المرور الحالية</label>
                        <LockIcon className="w-5 h-5 text-gray-400 absolute right-3 top-9" />
                        <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full mt-1 pr-10 pl-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">كلمة المرور الجديدة</label>
                        <LockIcon className="w-5 h-5 text-gray-400 absolute right-3 top-9" />
                        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 pr-10 pl-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700">تأكيد كلمة المرور الجديدة</label>
                        <LockIcon className="w-5 h-5 text-gray-400 absolute right-3 top-9" />
                        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 pr-10 pl-3 py-2 border border-gray-300 rounded-md" required />
                    </div>
                    
                    {passwordError && <p className="text-red-600 text-sm text-center">{passwordError}</p>}
                    {passwordSuccess && <p className="text-green-600 text-sm text-center">{passwordSuccess}</p>}
                    
                    <div className="pt-2 flex justify-end">
                         <button
                            type="submit"
                            disabled={isSavingPassword}
                            className="px-6 py-2 text-sm font-medium text-white bg-brand-light border border-transparent rounded-md shadow-sm hover:bg-brand-dark disabled:bg-opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {isSavingPassword ? 'جارِ الحفظ...' : 'تغيير كلمة المرور'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileManagement;