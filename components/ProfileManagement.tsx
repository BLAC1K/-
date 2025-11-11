import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { User, Role } from '../types';
import Avatar from './Avatar';
import LockIcon from './icons/LockIcon';
import SignatureIcon from './icons/SignatureIcon';
import SignaturePreview from './SignaturePreview';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';
import SignaturePad, { SignaturePadRef } from './SignaturePad';
import UploadIcon from './icons/UploadIcon';

const ProfileManagement: React.FC<{ user: User }> = ({ user }) => {
    const { updateUser } = useData();
    const isEmployee = user.role === Role.EMPLOYEE;

    const [formData, setFormData] = useState({
        fullName: user.fullName,
        jobTitle: user.jobTitle,
        badgeNumber: user.badgeNumber,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl || '',
        signatureData: user.signatureData,
        signatureImageUrl: user.signatureImageUrl,
    });

    const [imagePreview, setImagePreview] = useState<string | null>(user.profilePictureUrl || null);
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [signatureMode, setSignatureMode] = useState<'draw' | 'upload'>('draw');
    const signaturePadRef = useRef<SignaturePadRef>(null);

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

    const isProfileChanged = useMemo(() => {
        return (
            formData.fullName !== user.fullName ||
            formData.jobTitle !== user.jobTitle ||
            formData.badgeNumber !== user.badgeNumber ||
            formData.username !== user.username ||
            formData.profilePictureUrl !== (user.profilePictureUrl || '') ||
            JSON.stringify(formData.signatureData) !== JSON.stringify(user.signatureData) ||
            formData.signatureImageUrl !== user.signatureImageUrl
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
        <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-2xl mx-auto">
            <h3 className="text-2xl font-semibold text-brand-dark dark:text-gray-100 border-b dark:border-gray-700 pb-3 mb-6">الملف الشخصي</h3>
            
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
                            onChange={handleProfilePictureUpload}
                            className="hidden"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الاسم الثلاثي</label>
                        <input type="text" name="fullName" id="fullName" value={formData.fullName} onChange={handleDataChange} readOnly={isEmployee} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-100 dark:read-only:bg-gray-700/50" />
                    </div>
                     <div>
                        <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">الصفة الوظيفية</label>
                        <input type="text" name="jobTitle" id="jobTitle" value={formData.jobTitle} onChange={handleDataChange} readOnly={isEmployee} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-100 dark:read-only:bg-gray-700/50" />
                    </div>
                     <div>
                        <label htmlFor="badgeNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300">رقم الباج</label>
                        <input type="text" name="badgeNumber" id="badgeNumber" value={formData.badgeNumber} onChange={handleDataChange} readOnly={isEmployee} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-100 dark:read-only:bg-gray-700/50" />
                    </div>
                     <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">اسم المستخدم</label>
                        <input type="text" name="username" id="username" value={formData.username} onChange={handleDataChange} readOnly={isEmployee} className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-brand-light focus:border-brand-light sm:text-sm bg-white dark:bg-gray-700 dark:text-gray-200 read-only:bg-gray-100 dark:read-only:bg-gray-700/50" />
                    </div>
                </div>

                {/* Signature Section - Editable for Employees */}
                {user.role === Role.EMPLOYEE && (
                    <div className="pt-6 border-t dark:border-gray-700">
                        <h4 className="flex items-center text-xl font-semibold text-brand-dark dark:text-gray-100 mb-2">
                            <SignatureIcon className="w-5 h-5 ml-2" />
                            <span>توقيعك</span>
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            استخدم توقيعك لإرسال التقارير. يمكنك رسم توقيع جديد أو رفع صورة لتوقيعك.
                        </p>
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
                        {(formData.signatureImageUrl || (formData.signatureData && formData.signatureData.length > 0)) && (
                            <div className="mt-2 p-2 border dark:border-gray-600 rounded-md">
                                <p className="text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">معاينة التوقيع الحالي:</p>
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
                )}


                <div className="pt-4 border-t dark:border-gray-700 flex items-center justify-end">
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

            {user.role === Role.MANAGER && (
                <div className="pt-6 mt-6 border-t dark:border-gray-700">
                    <h4 className="text-xl font-semibold text-brand-dark dark:text-gray-100 mb-4">تغيير كلمة المرور</h4>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور الحالية</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <LockIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full pr-10 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-200" required />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(p => !p)}
                                    className="absolute inset-y-0 left-0 flex items-center pl-3"
                                    aria-label={showCurrentPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                >
                                    {showCurrentPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور الجديدة</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <LockIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full pr-10 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-200" required />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(p => !p)}
                                    className="absolute inset-y-0 left-0 flex items-center pl-3"
                                    aria-label={showNewPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                >
                                    {showNewPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">تأكيد كلمة المرور الجديدة</label>
                            <div className="relative mt-1">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <LockIcon className="w-5 h-5 text-gray-400" />
                                </div>
                                <input type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full pr-10 pl-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-gray-200" required />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(p => !p)}
                                    className="absolute inset-y-0 left-0 flex items-center pl-3"
                                    aria-label={showConfirmPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                                >
                                    {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5 text-gray-400" /> : <EyeIcon className="w-5 h-5 text-gray-400" />}
                                </button>
                            </div>
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
            )}
        </div>
    );
};

export default ProfileManagement;