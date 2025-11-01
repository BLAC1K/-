import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo, useEffect } from 'react';
import { User } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean; // For initial load
    loginLoading: boolean; // For login button process
    login: (phone: string, password: string, rememberMe: boolean) => Promise<boolean>;
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
    const { users } = useData();

    useEffect(() => {
        // Once the initial user ID is checked from storage, stop the initial loading.
        setLoading(false);
    }, []);

    const currentUser = useMemo(() => {
        if (!currentUserId) return null;
        return users.find(u => u.id === currentUserId) || null;
    }, [currentUserId, users]);

    const login = useCallback(async (phone: string, password: string, rememberMe: boolean): Promise<boolean> => {
        setLoginLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const user = users.find(u => u.phone === phone && u.password === password);
        if (user) {
            setCurrentUserId(user.id);
            if (rememberMe) {
                localStorage.setItem('loggedInUserId', user.id);
            } else {
                sessionStorage.setItem('loggedInUserId', user.id);
            }
            setLoginLoading(false);
            return true;
        }
        setLoginLoading(false);
        return false;
    }, [users]);

    const logout = useCallback(() => {
        // Clear from both storages on logout
        localStorage.removeItem('loggedInUserId');
        sessionStorage.removeItem('loggedInUserId');
        setCurrentUserId(null);
    }, []);

    const value = useMemo(() => ({ currentUser, loading, loginLoading, login, logout }), [currentUser, loading, loginLoading, login, logout]);

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};