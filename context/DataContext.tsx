
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

    const loadData = useCallback(async () => {
        setIsDataLoading(true);
        try {
            const { isCloud: cloudStatus, ...initialState } = await api.fetchInitialData();
            setAppState(initialState);
            setIsCloud(cloudStatus);
        } catch (error) {
            console.error("Failed to load initial data from API:", error);
            // In a real app, you might want to set an error state to show in the UI
        } finally {
            setIsDataLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);
    
    const getUserById = useCallback((id: string) => appState.users.find(u => u.id === id), [appState.users]);
    
    const performApiAction = useCallback(async (action: Promise<any>) => {
        try {
            await action;
            await loadData(); // After any change, refetch all data to stay in sync.
        } catch (error) {
            console.error("An API action failed:", error);
            // In a real app, you might show a toast notification to the user.
            throw error; // Re-throw so components can handle it if needed.
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
        appState, isDataLoading, isCloud, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
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
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
