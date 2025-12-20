
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { User, Report, Announcement, DirectTask } from '../types';
import * as api from '../services/apiService';

interface AppState {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    directTasks: DirectTask[];
}

interface DataContextType extends AppState {
    isDataLoading: boolean;
    isCloud: boolean;
    error: string | null;
    getUserById: (id: string) => User | undefined;
    addReport: (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>) => Promise<void>;
    updateReport: (updatedReport: Report) => Promise<void>;
    saveOrUpdateDraft: (draft: Partial<Report>) => Promise<void>;
    deleteReport: (reportId: string) => Promise<void>;
    markReportAsViewed: (reportId: string) => Promise<void>;
    markCommentAsRead: (reportId: string) => Promise<void>;
    addUser: (user: Omit<User, 'id'>) => Promise<void>;
    updateUser: (user: User) => Promise<void>;
    deleteUser: (userId: string) => Promise<void>;
    addAnnouncement: (content: string) => Promise<void>;
    updateAnnouncement: (announcementId: string, content: string) => Promise<void>;
    deleteAnnouncement: (announcementId: string) => Promise<void>;
    markAnnouncementAsRead: (announcementId: string, userId: string) => Promise<void>;
    addDirectTask: (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>) => Promise<void>;
    updateDirectTaskStatus: (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string) => Promise<void>;
    markDirectTaskAsRead: (taskId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useState<AppState>({ users: [], reports: [], announcements: [], directTasks: [] });
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isCloud, setIsCloud] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsDataLoading(true);
        setError(null);
        try {
            const data = await api.fetchInitialData();
            setAppState({
                users: data.users,
                reports: data.reports,
                announcements: data.announcements,
                directTasks: data.directTasks
            });
            setIsCloud(data.isCloud);
        } catch (error: any) {
            console.error("Failed to load data:", error);
            setError(error.message || "فشل الاتصال بقاعدة البيانات.");
        } finally {
            if (!silent) setIsDataLoading(false);
        }
    }, []);

    // تفعيل الاشتراك اللحظي عند تحميل التطبيق
    useEffect(() => {
        loadData();

        // إنشاء اشتراك مباشر للاستماع لأي تغيير في الجداول
        const unsubscribe = api.subscribeToAllChanges(() => {
            console.log("Real-time update received! Syncing data...");
            loadData(true); // تحديث البيانات صامتاً (بدون سبينر) فور حدوث أي تغيير
        });

        return () => {
            unsubscribe(); // تنظيف الاشتراك عند إغلاق التطبيق
        };
    }, [loadData]);
    
    const getUserById = useCallback((id: string) => appState.users.find(u => u.id === id), [appState.users]);
    
    const performApiAction = useCallback(async (action: Promise<any>) => {
        try {
            await action;
            // الميزة الآن أن Real-time سيقوم بالتحديث تلقائياً، 
            // لكننا نبقي على استدعاء loadData(true) هنا كضمان إضافي (Fallback)
            await loadData(true); 
        } catch (error) {
            console.error("Action failed:", error);
            throw error;
        }
    }, [loadData]);

    const addReport = useCallback(async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>) => performApiAction(api.createReport(report)), [performApiAction]);
    const updateReport = useCallback(async (updatedReport: Report) => performApiAction(api.updateReport(updatedReport)), [performApiAction]);
    const saveOrUpdateDraft = useCallback(async (draft: Partial<Report>) => performApiAction(api.saveOrUpdateDraft(draft)), [performApiAction]);
    const deleteReport = useCallback(async (reportId: string) => performApiAction(api.deleteReport(reportId)), [performApiAction]);
    const markReportAsViewed = useCallback(async (reportId: string) => performApiAction(api.markReportAsViewed(reportId)), [performApiAction]);
    const markCommentAsRead = useCallback(async (reportId: string) => performApiAction(api.markCommentAsRead(reportId)), [performApiAction]);
    const addUser = useCallback(async (user: Omit<User, 'id'>) => performApiAction(api.createUser(user)), [performApiAction]);
    const updateUser = useCallback(async (updatedUser: User) => performApiAction(api.updateUser(updatedUser)), [performApiAction]);
    const deleteUser = useCallback(async (userId: string) => performApiAction(api.deleteUser(userId)), [performApiAction]);
    const addAnnouncement = useCallback(async (content: string) => performApiAction(api.createAnnouncement(content)), [performApiAction]);
    const updateAnnouncement = useCallback(async (announcementId: string, content: string) => performApiAction(api.updateAnnouncement(announcementId, content)), [performApiAction]);
    const deleteAnnouncement = useCallback(async (announcementId: string) => performApiAction(api.deleteAnnouncement(announcementId)), [performApiAction]);
    const markAnnouncementAsRead = useCallback(async (announcementId: string, userId: string) => performApiAction(api.markAnnouncementAsRead(announcementId, userId)), [performApiAction]);
    const addDirectTask = useCallback(async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>) => performApiAction(api.createDirectTask(task)), [performApiAction]);
    const updateDirectTaskStatus = useCallback(async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string) => performApiAction(api.updateDirectTaskStatus(taskId, status, rejectionReason)), [performApiAction]);
    const markDirectTaskAsRead = useCallback(async (taskId: string) => performApiAction(api.markDirectTaskAsRead(taskId)), [performApiAction]);

    const value = useMemo(() => ({
        ...appState,
        isDataLoading,
        isCloud,
        error,
        getUserById,
        addReport,
        updateReport,
        saveOrUpdateDraft,
        deleteReport,
        markReportAsViewed,
        markCommentAsRead,
        addUser,
        updateUser,
        deleteUser,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        markAnnouncementAsRead,
        addDirectTask,
        updateDirectTaskStatus,
        markDirectTaskAsRead
    }), [
        appState, isDataLoading, isCloud, error, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead
    ]);

    return (
        <DataContext.Provider value={value}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};
