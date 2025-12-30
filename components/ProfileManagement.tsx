
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { User, Role } from '../types';
import Avatar from './Avatar';
import LockIcon from './icons/LockIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import BellIcon from './icons/BellIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ExclamationCircleIcon from './icons/ExclamationCircleIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import SparklesIcon from './icons/SparklesIcon';

const ProfileManagement: React.FC<{ user: User }> = ({ user }) => {
    const { updateUser, testNotification } = useData();
    const isEmployee = user.role === Role.EMPLOYEE;

    const [formData, setFormData] = useState({
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        badgeNumber: user.badgeNumber,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl || '',
    });

    const [imagePreview, setImagePreview] = useState<string | null>(user.profilePictureUrl || null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if ('Notification' in window) {
            setNotificationPermission(Notification.permission);
        }
    }, []);

    const handleDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleProfilePictureUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
            formData.username !== user.username ||
            formData.profilePictureUrl !== (user.profilePictureUrl || '')
        );
    }, [formData, user]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccessMessage('');

        const updatedUser = { ...user, ...formData };
        await updateUser(updatedUser);
        
        setIsSaving(false);
        setSuccessMessage('تم تحديث الملف الشخصي بنجاح!');
        setTimeout(() => setSuccessMessage(''), 3000);
    }, [user, formData, updateUser]);

    const handlePasswordSubmit = useCallback(async (e: React.FormEvent) => {
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
        await updateUser({ ...user, password: newPassword });
        setIsSavingPassword(false);
        setPasswordSuccess('تم تغيير كلمة المرور بنجاح!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(''), 3000);

    }, [user, currentPassword, newPassword, confirmPassword, updateUser]);

    const requestNotificationPermission = async () => {
        if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission === 'granted') {
                setSuccessMessage('تم تفعيل إشعارات المتصفح بنجاح!');
                setTimeout(() => setSuccessMessage(''), 3000);
            }
        }
    };

    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-sm max-w-2xl mx-auto space-y-8 animate-fade-in">
            <div>
                <h3 className="text-2xl font-bold text-brand-dark dark:text-gray-100 border-b dark:border-gray-700 pb-3 mb-6 flex items-center">
                    <UserCircleIcon className="w-7 h-7 ml-2 text-brand-light" />
                    الملف الشخصي
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col items-center space-y-4">
                        <Avatar src={imagePreview || undefined} name={formData.fullName} size={110} className="ring-4 ring-brand-light/10" />
                        <div>
                            <label htmlFor="profile-picture-upload" className="cursor-pointer px-5 py-2 text-sm font-bold text-white bg-brand-light rounded-full shadow-md hover:bg-brand-dark transition-all active:scale-95 inline-block">
                                تغيير الصورة
                            </label>
                            <input 
                                id="profile-picture-upload"
                                type="file" 
                                accept="image/*"
                                onChange={handleProfilePictureUpload}
                                className="hidden"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                            <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الاسم الثلاثي</label>
                            <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleDataChange} readOnly={isEmployee} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-light/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-50 dark:read-only:bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الصفة الوظيفية</label>
                            <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleDataChange} readOnly={isEmployee} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-light/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-50 dark:read-only:bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor="badgeNumber" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">الرقم الوظيفي</label>
                            <input type="text" name="badgeNumber" id="badgeNumber" value={formData.badgeNumber} onChange={handleDataChange} readOnly={isEmployee} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-light/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-50 dark:read-only:bg-gray-800" />
                        </div>
                        <div>
                            <label htmlFor="username" className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">اسم المستخدم</label>
                            <input type="text" name="username" id="username" value={formData.username} onChange={handleDataChange} readOnly={isEmployee} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-light/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-50 dark:read-only:bg-gray-800" />
                        </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                        {successMessage && <p className="text-green-600 font-bold text-sm ml-4 animate-fade-in">{successMessage}</p>}
                        <button
                            type="submit"
                            disabled={isSaving || !isProfileChanged}
                            className="px-8 py-3 text-sm font-bold text-white bg-brand-light rounded-xl shadow-lg shadow-brand-light/20 hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                        >
                            {isSaving ? 'جارِ الحفظ...' : 'حفظ التعديلات'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Notification Settings Section */}
            <div className="pt-8 border-t dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-brand-dark dark:text-gray-100 flex items-center">
                        <BellIcon className="w-6 h-6 ml-2 text-brand-light" />
                        إعدادات التنبيهات
                    </h4>
                    <button 
                        onClick={testNotification}
                        className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-brand-light bg-brand-light/10 rounded-lg hover:bg-brand-light/20 transition-all active:scale-95"
                    >
                        <SparklesIcon className="w-4 h-4" />
                        اختبار التنبيه
                    </button>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-right">
                            <p className="font-bold text-gray-800 dark:text-gray-200">إشعارات المتصفح والصوت</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">تلقي تنبيهات فورية مع صوت اهتزاز عند وصول مهام أو تعليقات جديدة.</p>
                        </div>
                        
                        {notificationPermission === 'granted' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl font-bold text-sm">
                                <CheckCircleIcon className="w-5 h-5" />
                                مفعلة بالكامل
                            </div>
                        ) : notificationPermission === 'denied' ? (
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl font-bold text-sm">
                                <ExclamationCircleIcon className="w-5 h-5" />
                                محظورة حالياً
                            </div>
                        ) : (
                            <button 
                                onClick={requestNotificationPermission}
                                className="px-6 py-2 bg-brand-light text-white rounded-xl font-bold text-sm hover:bg-brand-dark transition-all active:scale-95 shadow-md shadow-brand-light/20"
                            >
                                تفعيل الآن
                            </button>
                        )}
                    </div>
                    
                    {/* تحذير خاص بمستخدمي iOS */}
                    <div className="mt-4 p-3 bg-brand-accent-yellow/10 border border-brand-accent-yellow/20 rounded-xl">
                        <p className="text-[10px] text-brand-dark dark:text-brand-accent-yellow font-bold leading-relaxed">
                            💡 ملاحظة لمستخدمي آيفون (iOS): التنبيهات لا تعمل إلا في حال "إضافة التطبيق للشاشة الرئيسية" (PWA). يرجى التأكد من تثبيت التطبيق وتفعيله من إعدادات النظام.
                        </p>
                    </div>

                    {notificationPermission === 'denied' && (
                        <p className="mt-3 text-[10px] text-center text-red-500 dark:text-red-400 font-medium">
                            لقد قمت بحظر الإشعارات مسبقاً. يرجى تفعيلها من إعدادات المتصفح (أيقونة القفل بجانب الرابط) لتلقي التنبيهات.
                        </p>
                    )}
                </div>
            </div>

            {user.role === Role.MANAGER && (
                <div className="pt-8 border-t dark:border-gray-700">
                    <h4 className="text-xl font-bold text-brand-dark dark:text-gray-100 mb-4 flex items-center">
                        <LockIcon className="w-6 h-6 ml-2 text-brand-light" />
                        تغيير كلمة المرور
                    </h4>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الحالية</label>
                            <div className="relative">
                                <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-light/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200" required />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(p => !p)}
                                    className="absolute inset-y-0 left-0 flex items-center pl-4"
                                >
                                    {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">كلمة المرور الجديدة</label>
                                <div className="relative">
                                    <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-light/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200" required />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(p => !p)}
                                        className="absolute inset-y-0 left-0 flex items-center pl-4"
                                    >
                                        {showNewPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">تأكيد كلمة المرور</label>
                                <div className="relative">
                                    <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-brand-light/50 outline-none bg-white dark:bg-gray-700 dark:text-gray-200" required />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(p => !p)}
                                        className="absolute inset-y-0 left-0 flex items-center pl-4"
                                    >
                                        {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        {passwordError && <p className="text-red-600 font-bold text-xs text-center">{passwordError}</p>}
                        {passwordSuccess && <p className="text-green-600 font-bold text-xs text-center">{passwordSuccess}</p>}
                        
                        <div className="pt-2 flex justify-end">
                             <button
                                type="submit"
                                disabled={isSavingPassword}
                                className="px-8 py-3 text-sm font-bold text-white bg-brand-light rounded-xl shadow-lg shadow-brand-light/20 hover:bg-brand-dark transition-all active:scale-95"
                            >
                                {isSavingPassword ? 'جارِ الحفظ...' : 'تغيير كلمة المرور'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ProfileManagement;
