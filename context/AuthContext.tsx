import React, { createContext, useState, useContext, ReactNode, useCallback, useMemo } from 'react';
import { User } from '../types';
import { useData } from './DataContext';

interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    login: (phone: string, password: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { users } = useData();

    const currentUser = useMemo(() => {
        if (!currentUserId) return null;
        return users.find(u => u.id === currentUserId) || null;
    }, [currentUserId, users]);

    const login = useCallback(async (phone: string, password: string): Promise<boolean> => {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500)); 
        const user = users.find(u => u.phone === phone && u.password === password);
        if (user) {
            setCurrentUserId(user.id);
            setLoading(false);
            return true;
        }
        setLoading(false);
        return false;
    }, [users]);

    const logout = () => {
        setCurrentUserId(null);
    };

    const value = useMemo(() => ({ currentUser, loading, login, logout }), [currentUser, loading, login, logout]);

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