
import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import Login from './components/Login';
import EmployeeDashboard from './components/EmployeeDashboard';
import ManagerDashboard from './components/ManagerDashboard';

const AppContent: React.FC = () => {
    const { currentUser, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-100">
                <div className="text-xl font-semibold text-gray-700">تحميل...</div>
            </div>
        );
    }
    
    if (!currentUser) {
        return <Login />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {currentUser.role === 'employee' ? <EmployeeDashboard /> : <ManagerDashboard />}
        </div>
    );
};

const App: React.FC = () => {
    return (
        <DataProvider>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </DataProvider>
    );
};

export default App;