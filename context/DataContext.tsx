
import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect, useRef } from 'react';
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
    isSyncing: boolean;
    notification: { message: string, type: 'info' | 'success', id: number } | null;
    clearNotification: () => void;
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
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCloud, setIsCloud] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'info' | 'success', id: number } | null>(null);
    
    const currentUserIdRef = useRef<string | null>(null);

    const clearNotification = useCallback(() => setNotification(null), []);

    const sendBrowserNotification = (title: string, body: string) => {
        if ("Notification" in window && Notification.permission === "granted") {
            try {
                new Notification(title, { body, icon: '/icon.png' });
            } catch (e) {
                console.warn("Browser Notification failed", e);
            }
        }
    };

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsDataLoading(true);
        else setIsSyncing(true);
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
            console.error("Sync Error:", error);
            if (!silent) setError(error.message || "فشل الاتصال بقاعدة البيانات.");
        } finally {
            setIsDataLoading(false);
            setIsSyncing(false);
        }
    }, []);

    // المزامنة عند عودة المستخدم للتطبيق لضمان التحديث
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                loadData(true);
            }
        };
        window.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('focus', () => loadData(true));
        return () => {
            window.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [loadData]);

    useEffect(() => {
        loadData();
        currentUserIdRef.current = localStorage.getItem('loggedInUserId') || sessionStorage.getItem('loggedInUserId');

        const unsubscribe = api.subscribeToAllChanges((payload) => {
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            setAppState(prev => {
                const newState = { ...prev };
                if (table === 'reports') {
                    const mapped = api.mapReport(newRecord);
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const exists = prev.reports.findIndex(r => r.id === mapped.id);
                        if (exists > -1) newState.reports = prev.reports.map(r => r.id === mapped.id ? mapped : r);
                        else {
                            newState.reports = [mapped, ...prev.reports];
                            if (eventType === 'INSERT' && mapped.userId !== currentUserIdRef.current) {
                                // تنبيه للمدير عند وصول تقرير جديد
                                const sender = prev.users.find(u => u.id === mapped.userId);
                                sendBrowserNotification('تقرير جديد', `أرسل ${sender?.fullName || 'منتسب'} تقريراً جديداً.`);
                            }
                        }
                    } else if (eventType === 'DELETE') {
                        newState.reports = prev.reports.filter(r => r.id !== oldRecord.id);
                    }
                } else if (table === 'direct_tasks') {
                    const mapped = api.mapDirectTask(newRecord);
                    if (eventType === 'INSERT') {
                        newState.directTasks = [mapped, ...prev.directTasks];
                        if (mapped.employeeId === currentUserIdRef.current) {
                            sendBrowserNotification('مهمة جديدة', 'لقد وجه إليك المسؤول مهمة عمل جديدة.');
                            setNotification({ message: 'وصلتك مهمة عمل جديدة!', type: 'info', id: Date.now() });
                        }
                    } else if (eventType === 'UPDATE') newState.directTasks = prev.directTasks.map(t => t.id === mapped.id ? mapped : t);
                } else if (table === 'announcements') {
                    const mapped = api.mapAnnouncement(newRecord);
                    if (eventType === 'INSERT') {
                        newState.announcements = [mapped, ...prev.announcements];
                        sendBrowserNotification('تعميم إداري', 'يوجد توجيه إداري جديد للجميع.');
                        setNotification({ message: 'توجيه إداري جديد للجميع.', type: 'info', id: Date.now() });
                    }
                } else if (table === 'users') {
                    const mapped = api.mapUser(newRecord);
                    if (eventType === 'UPDATE') newState.users = prev.users.map(u => u.id === mapped.id ? mapped : u);
                }
                return newState;
            });
        });

        return () => { unsubscribe(); };
    }, [loadData]);
    
    const getUserById = useCallback((id: string) => appState.users.find(u => u.id === id), [appState.users]);

    const saveOrUpdateDraft = useCallback(async (draft: Partial<Report>) => {
        const tempId = draft.id || `temp-${Date.now()}`;
        const tempDraft = { id: tempId, status: 'draft', ...draft } as Report;
        setAppState(prev => {
            const exists = prev.reports.find(r => r.id === draft.id);
            if (exists) return { ...prev, reports: prev.reports.map(r => r.id === draft.id ? { ...r, ...tempDraft } : r) };
            return { ...prev, reports: [tempDraft, ...prev.reports] };
        });
        try { await api.saveOrUpdateDraft(draft); } catch (error) { loadData(true); throw error; }
    }, [loadData]);

    const addReport = useCallback(async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>) => {
        try { await api.createReport(report); } catch (error) { throw error; }
    }, []);

    const updateReport = useCallback(async (updatedReport: Report) => {
        setAppState(prev => ({ ...prev, reports: prev.reports.map(r => r.id === updatedReport.id ? updatedReport : r) }));
        try { await api.updateReport(updatedReport); } catch (error) { loadData(true); throw error; }
    }, [loadData]);

    const deleteReport = useCallback(async (reportId: string) => {
        setAppState(prev => ({ ...prev, reports: prev.reports.filter(r => r.id !== reportId) }));
        try { await api.deleteReport(reportId); } catch (error) { loadData(true); throw error; }
    }, [loadData]);

    const markReportAsViewed = useCallback(async (reportId: string) => api.markReportAsViewed(reportId), []);
    const markCommentAsRead = useCallback(async (reportId: string) => api.markCommentAsRead(reportId), []);
    const addUser = useCallback(async (user: Omit<User, 'id'>) => api.createUser(user), []);
    const updateUser = useCallback(async (updatedUser: User) => api.updateUser(updatedUser), []);
    const deleteUser = useCallback(async (userId: string) => api.deleteUser(userId), []);
    const addAnnouncement = useCallback(async (content: string) => api.createAnnouncement(content), []);
    const updateAnnouncement = useCallback(async (announcementId: string, content: string) => api.updateAnnouncement(announcementId, content), []);
    const deleteAnnouncement = useCallback(async (announcementId: string) => api.deleteAnnouncement(announcementId), []);
    const markAnnouncementAsRead = useCallback(async (announcementId: string, userId: string) => api.markAnnouncementAsRead(announcementId, userId), []);
    const addDirectTask = useCallback(async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>) => api.createDirectTask(task), []);
    const updateDirectTaskStatus = useCallback(async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string) => api.updateDirectTaskStatus(taskId, status, rejectionReason), []);
    const markDirectTaskAsRead = useCallback(async (taskId: string) => api.markDirectTaskAsRead(taskId), []);

    const value = useMemo(() => ({
        ...appState, isDataLoading, isCloud, error, isSyncing, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead
    }), [
        appState, isDataLoading, isCloud, error, isSyncing, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
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
