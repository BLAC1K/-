
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider, useData } from './context/DataContext';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {
    const { currentUser, loading: authLoading } = useAuth();
    const { isDataLoading } = useData();

    if (authLoading || isDataLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="text-xl font-semibold text-gray-700 dark:text-gray-300">تحميل...</div>
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
            <AuthProvider>
                <DataProvider>
                    <AppContent />
                </DataProvider>
            </AuthProvider>
        </ThemeProvider>
    );
};

export default App;