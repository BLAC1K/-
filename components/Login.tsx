import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LockIcon from './icons/LockIcon';
import AppLogoIcon from './icons/AppLogoIcon';
import PhoneIcon from './icons/PhoneIcon';
import EyeIcon from './icons/EyeIcon';
import EyeSlashIcon from './icons/EyeSlashIcon';


const Login: React.FC = () => {
    const { login, loginLoading } = useAuth();

    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');
    
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!phone || !password) {
            setError('الرجاء إدخال رقم الهاتف وكلمة المرور.');
            return;
        }
        const success = await login(phone, password, rememberMe);
        if (!success) {
            setError('رقم الهاتف أو كلمة المرور غير صحيحة.');
        }
    };
    
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-brand-dark to-[#3a7c93] relative overflow-hidden">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-brand-light rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-brand-accent-yellow rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-brand-accent-red rounded-full mix-blend-screen filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>

            <div className="w-full max-w-md p-8 space-y-6 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl z-10">
                <div className="flex flex-col items-center text-center">
                    <AppLogoIcon className="w-32 h-32 mb-4 text-white"/>
                    <h2 className="text-3xl font-bold text-white">المهام اليومية</h2>
                    <p className="mt-2 text-sm text-gray-200">نظام تسجيل التقارير الداخلي</p>
                    <p className="mt-4 text-xs text-gray-200 bg-white/10 p-2 rounded-md">
                        للمنتسبين الجدد، يتم إنشاء الحساب من قبل المسؤول.
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLoginSubmit}>
                    <div className="space-y-4 rounded-md">
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <PhoneIcon className="w-5 h-5 text-gray-300" />
                            </div>
                            <input id="phone" name="phone" type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-3 text-white placeholder-gray-300 bg-white/10 border border-white/30 rounded-md appearance-none pr-10 focus:outline-none focus:ring-brand-accent-yellow focus:border-brand-accent-yellow sm:text-sm" placeholder="رقم الهاتف" />
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <LockIcon className="w-5 h-5 text-gray-300" />
                            </div>
                            <input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-3 text-white placeholder-gray-300 bg-white/10 border border-white/30 rounded-md appearance-none pr-10 pl-10 focus:outline-none focus:ring-brand-accent-yellow focus:border-brand-accent-yellow sm:text-sm" placeholder="كلمة المرور" />
                             <button 
                                type="button" 
                                onClick={() => setShowPassword(!showPassword)} 
                                className="absolute inset-y-0 left-0 flex items-center pl-3"
                                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                            >
                                {showPassword ? (
                                    <EyeSlashIcon className="w-5 h-5 text-gray-300" />
                                ) : (
                                    <EyeIcon className="w-5 h-5 text-gray-300" />
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center">
                        <input
                            id="remember-me"
                            name="remember-me"
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 text-brand-accent-yellow bg-gray-100 border-gray-300 rounded focus:ring-brand-accent-yellow"
                        />
                        <label htmlFor="remember-me" className="block mr-2 text-sm text-gray-200">
                            تذكرني
                        </label>
                    </div>

                    {error && <p className="text-sm text-brand-accent-yellow text-center font-semibold">{error}</p>}
                    <div>
                        <button type="submit" disabled={loginLoading} className="relative flex justify-center w-full px-4 py-3 text-sm font-bold text-brand-dark bg-brand-accent-yellow border border-transparent rounded-md group hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-brand-accent-yellow disabled:bg-opacity-70 transition-colors">
                            {loginLoading ? 'جارِ التسجيل...' : 'دخول'}
                        </button>
                    </div>
                </form>

            </div>
            <footer className="absolute bottom-4 text-center text-xs text-gray-300 z-10">
                <p>جميع الحقوق محفوظة 2025م</p>
                <p>حسين كاظم</p>
            </footer>
        </div>
    );
};

export default Login;