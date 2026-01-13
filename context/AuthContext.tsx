
import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { User } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean; // For initial load
    loginLoading: boolean; // For login button process
    login: (username: string, password: string, rememberMe: boolean) => Promise<{success: boolean, message?: string}>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(() => {
        // Check long-term storage first, then session storage
        return localStorage.getItem('loggedInUserId') || sessionStorage.getItem('loggedInUserId');
    });
    const [loading, setLoading] = useState(true);
    const [loginLoading, setLoginLoading] = useState(false);
    const { users, isDataLoading } = useData();

    useEffect(() => {
        // Once the initial user ID is checked from storage, stop the initial loading.
        setLoading(false);
    }, []);

    const currentUser = useMemo(() => {
        if (!currentUserId || users.length === 0) return null;
        return users.find(u => u.id === currentUserId) || null;
    }, [currentUserId, users]);

    const login = useCallback(async (username: string, password: string, rememberMe: boolean): Promise<{success: boolean, message?: string}> => {
        setLoginLoading(true);
        
        // التأكد من تحميل البيانات أولاً
        if (users.length === 0 && !isDataLoading) {
            setLoginLoading(false);
            return { success: false, message: 'تعذر الاتصال بقاعدة البيانات حالياً.' };
        }

        // محاكاة تأخير بسيط للواقعية
        await new Promise(resolve => setTimeout(resolve, 600)); 

        const cleanUsername = username.trim().toLowerCase();
        const cleanPassword = password.trim();

        const user = users.find(u => 
            u.username.toLowerCase() === cleanUsername && 
            u.password === cleanPassword
        );

        if (user) {
            setCurrentUserId(user.id);
            if (rememberMe) {
                localStorage.setItem('loggedInUserId', user.id);
            } else {
                sessionStorage.setItem('loggedInUserId', user.id);
            }
            setLoginLoading(false);
            return { success: true };
        }

        setLoginLoading(false);
        return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
    }, [users, isDataLoading]);

    const logout = useCallback(() => {
        // Clear from both storages on logout
        localStorage.removeItem('loggedInUserId');
        sessionStorage.removeItem('loggedInUserId');
        setCurrentUserId(null);
    }, []);

    const value = useMemo(() => ({ currentUser, loading, loginLoading, login, logout }), [currentUser, loading, loginLoading, login, logout]);

    return (
        <ThemeAwareProvider value={value}>
            {children}
        </ThemeAwareProvider>
    );
};

// ملف تعريف وسيط لتجنب مشاكل التكرار في السياق
const ThemeAwareProvider = AuthContext.Provider;

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
