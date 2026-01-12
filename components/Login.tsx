
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import LockIcon from './icons/LockIcon';
import AppLogoIcon from './icons/AppLogoIcon';
import UserIcon from './icons/UserIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';

const Login: React.FC = () => {
    const { login, loginLoading } = useAuth();
    const { unlockAudio } = useData();

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        unlockAudio();

        if (!username || !password) {
            setError('الرجاء إدخال اسم المستخدم وكلمة المرور.');
            return;
        }
        const success = await login(username, password, rememberMe);
        if (!success) {
            setError('اسم المستخدم أو كلمة المرور غير صحيحة.');
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-[#f8f9fc] dark:bg-gray-950 font-['Cairo'] p-4">
            <div className="w-full max-w-md animate-scale-in">
                <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col items-center text-center mb-10">
                        <div className="w-20 h-20 mb-4 transition-transform hover:scale-110 duration-500">
                            <AppLogoIcon />
                        </div>
                        <h2 className="text-2xl font-black text-brand-dark dark:text-white">تسجيل الدخول</h2>
                        <p className="mt-1 text-xs text-gray-400 font-bold uppercase tracking-widest">نظام التقارير اليومية</p>
                    </div>

                    <form className="space-y-6" onSubmit={handleLoginSubmit}>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mr-2 mb-1.5 uppercase">اسم المستخدم</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
                                        <UserIcon className="w-5 h-5" />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={username} 
                                        onChange={(e) => setUsername(e.target.value)} 
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-light/20 rounded-2xl pr-12 text-sm outline-none transition-all dark:text-white" 
                                        placeholder="Username" 
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 mr-2 mb-1.5 uppercase">كلمة المرور</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400">
                                        <LockIcon className="w-5 h-5" />
                                    </div>
                                    <input 
                                        type={showPassword ? 'text' : 'password'} 
                                        value={password} 
                                        onChange={(e) => setPassword(e.target.value)} 
                                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-brand-light/20 rounded-2xl pr-12 pl-12 text-sm outline-none transition-all dark:text-white" 
                                        placeholder="••••••••" 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)} 
                                        className="absolute inset-y-0 left-0 flex items-center pl-4 text-gray-400"
                                    >
                                        {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center mr-1">
                            <input
                                id="remember-me"
                                type="checkbox"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-4 h-4 text-brand-light border-gray-300 rounded focus:ring-brand-light/30"
                            />
                            <label htmlFor="remember-me" className="mr-3 text-xs font-bold text-gray-500 cursor-pointer">تذكرني على هذا الجهاز</label>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-xl">
                                <p className="text-[11px] text-red-600 dark:text-red-400 text-center font-bold">{error}</p>
                            </div>
                        )}

                        <button 
                            type="submit" 
                            disabled={loginLoading} 
                            className="w-full py-4 bg-brand-dark text-white rounded-2xl font-black text-sm shadow-lg hover:bg-brand-light transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loginLoading ? 'جارِ التحقق...' : 'دخول للنظام'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
