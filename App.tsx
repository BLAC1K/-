
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import { PWAProvider } from './context/PWAContext';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import { ThemeProvider } from './context/ThemeContext';
import ExclamationCircleIcon from './components/icons/ExclamationCircleIcon';

const AppContent: React.FC = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const { isDataLoading, error } = useData();

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-4 text-center">
                 <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-md w-full border border-red-200 dark:border-red-900">
                    <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">خطأ في الاتصال</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    
                    {error.includes('relation') && (
                        <div className="text-sm text-left bg-gray-100 dark:bg-gray-700 p-3 rounded mb-4 overflow-x-auto text-gray-700 dark:text-gray-300">
                            <p className="font-semibold mb-1">الحل المقترح:</p>
                            <p>يبدو أن جداول قاعدة البيانات غير موجودة. يرجى الذهاب إلى Supabase SQL Editor وتشغيل الكود لإنشاء الجداول.</p>
                        </div>
                    )}

                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-2 bg-brand-light text-white rounded hover:bg-brand-dark transition-colors"
                    >
                        إعادة المحاولة
                    </button>
                 </div>
            </div>
        );
    }

    if (authLoading || isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-brand-light border-t-transparent rounded-full animate-spin mb-4"></div>
                    <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">جاري الاتصال بقاعدة البيانات...</div>
                </div>
            </div>
        );
    }
    
    if (!currentUser) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {currentUser.role === 'employee' ? <EmployeeDashboard /> : <ManagerDashboard />}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <ThemeProvider>
            <DataProvider>
                <PWAProvider>
                    <AuthProvider>
                        <AppContent />
                    </AuthProvider>
                </PWAProvider>
            </DataProvider>
        </ThemeProvider>
    );
};

export default App;
