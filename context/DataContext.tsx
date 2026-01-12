
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
    refreshData: () => Promise<void>;
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
    unlockAudio: () => void;
    // Added testNotification to resolve Property 'testNotification' does not exist error.
    testNotification: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [appState, setAppState] = useState<AppState>({ users: [], reports: [], announcements: [], directTasks: [] });
    const [isDataLoading, setIsDataLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isCloud, setIsCloud] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'info' | 'success', id: number } | null>(null);
    
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audioRef.current.load();
    }, []);

    const unlockAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                if (audioRef.current) audioRef.current.currentTime = 0;
            }).catch(() => {});
        }
    }, []);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.5;
            audioRef.current.play().catch(() => {});
        }
    }, []);

    const triggerNotification = useCallback((message: string, type: 'info' | 'success' = 'info') => {
        setNotification({ message, type, id: Date.now() });
        playNotificationSound();
        if ("vibrate" in navigator) navigator.vibrate(200);
    }, [playNotificationSound]);

    // Implementation of testNotification to provide a way to verify notifications are working.
    const testNotification = useCallback(() => {
        triggerNotification('هذا إشعار تجريبي للتحقق من عمل التنبيهات.', 'info');
    }, [triggerNotification]);

    const clearNotification = useCallback(() => setNotification(null), []);

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
            if (!silent) setError(error.message || "فشل الاتصال.");
        } finally {
            setIsDataLoading(false);
            setIsSyncing(false);
        }
    }, []);

    const refreshData = useCallback(async () => {
        await loadData(true);
    }, [loadData]);

    // نظام المزامنة اللحظية المطور
    useEffect(() => {
        const unsubscribe = api.subscribeToAllChanges((payload) => {
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            const loggedInUserId = localStorage.getItem('loggedInUserId') || sessionStorage.getItem('loggedInUserId');
            
            setAppState(prev => {
                let newState = { ...prev };

                if (table === 'reports') {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const mapped = api.mapReport(newRecord);
                        const existsIndex = prev.reports.findIndex(r => r.id === mapped.id);
                        const updatedReports = existsIndex > -1 
                            ? prev.reports.map(r => r.id === mapped.id ? mapped : r)
                            : [mapped, ...prev.reports];
                        
                        newState.reports = updatedReports;

                        // إشعارات للمدير
                        const currentUser = prev.users.find(u => u.id === loggedInUserId);
                        if (eventType === 'INSERT' && mapped.status === 'submitted' && currentUser?.role === 'manager') {
                            const sender = prev.users.find(u => u.id === mapped.userId);
                            triggerNotification(`تقرير جديد من ${sender?.fullName.split(' ')[0]}`);
                        }
                        // إشعارات للمنتسب
                        if (eventType === 'UPDATE' && mapped.userId === loggedInUserId && mapped.managerComment && mapped.managerComment !== prev.reports[existsIndex]?.managerComment) {
                            triggerNotification('ملاحظة إدارية جديدة على تقريرك', 'success');
                        }
                    } else if (eventType === 'DELETE') {
                        newState.reports = prev.reports.filter(r => r.id !== oldRecord.id);
                    }
                } 
                else if (table === 'direct_tasks') {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const mapped = api.mapDirectTask(newRecord);
                        const existsIndex = prev.directTasks.findIndex(t => t.id === mapped.id);
                        newState.directTasks = existsIndex > -1 
                            ? prev.directTasks.map(t => t.id === mapped.id ? mapped : t)
                            : [mapped, ...prev.directTasks];

                        if (eventType === 'INSERT' && mapped.employeeId === loggedInUserId) {
                            triggerNotification('وصلتك مهمة عمل فورية جديدة');
                        }
                    } else if (eventType === 'DELETE') {
                        newState.directTasks = prev.directTasks.filter(t => t.id !== oldRecord.id);
                    }
                }
                else if (table === 'users') {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const mapped = api.mapUser(newRecord);
                        newState.users = prev.users.some(u => u.id === mapped.id)
                            ? prev.users.map(u => u.id === mapped.id ? mapped : u)
                            : [...prev.users, mapped];
                    }
                }

                return newState;
            });
        });

        return () => { unsubscribe(); };
    }, [triggerNotification]);

    // وظائف التحديث مع خاصية التحديث المتفائل (Optimistic Update)
    const markReportAsViewed = useCallback(async (reportId: string) => {
        // تحديث محلي فوري
        setAppState(prev => ({
            ...prev,
            reports: prev.reports.map(r => r.id === reportId ? { ...r, isViewedByManager: true } : r)
        }));
        await api.markReportAsViewed(reportId);
    }, []);

    const markCommentAsRead = useCallback(async (reportId: string) => {
        setAppState(prev => ({
            ...prev,
            reports: prev.reports.map(r => r.id === reportId ? { ...r, isCommentReadByEmployee: true } : r)
        }));
        await api.markCommentAsRead(reportId);
    }, []);

    const markDirectTaskAsRead = useCallback(async (taskId: string) => {
        setAppState(prev => ({
            ...prev,
            directTasks: prev.directTasks.map(t => t.id === taskId ? { ...t, isReadByEmployee: true } : t)
        }));
        await api.markDirectTaskAsRead(taskId);
    }, []);

    const getUserById = useCallback((id: string) => appState.users.find(u => u.id === id), [appState.users]);
    const saveOrUpdateDraft = useCallback(async (draft: Partial<Report>) => { await api.saveOrUpdateDraft(draft); }, []);
    const addReport = useCallback(async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>) => { await api.createReport(report); }, []);
    const updateReport = useCallback(async (updatedReport: Report) => { await api.updateReport(updatedReport); }, []);
    const deleteReport = useCallback(async (reportId: string) => { await api.deleteReport(reportId); }, []);
    const addUser = useCallback(async (user: Omit<User, 'id'>) => api.createUser(user), []);
    const updateUser = useCallback(async (updatedUser: User) => api.updateUser(updatedUser), []);
    const deleteUser = useCallback(async (userId: string) => api.deleteUser(userId), []);
    const addAnnouncement = useCallback(async (content: string) => api.createAnnouncement(content), []);
    const updateAnnouncement = useCallback(async (announcementId: string, content: string) => api.updateAnnouncement(announcementId, content), []);
    const deleteAnnouncement = useCallback(async (announcementId: string) => api.deleteAnnouncement(announcementId), []);
    const markAnnouncementAsRead = useCallback(async (announcementId: string, userId: string) => api.markAnnouncementAsRead(announcementId, userId), []);
    const addDirectTask = useCallback(async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>) => api.createDirectTask(task), []);
    const updateDirectTaskStatus = useCallback(async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string) => {
        setAppState(prev => ({
            ...prev,
            directTasks: prev.directTasks.map(t => t.id === taskId ? { ...t, status, rejectionReason } : t)
        }));
        await api.updateDirectTaskStatus(taskId, status, rejectionReason);
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const value = useMemo(() => ({
        ...appState, isDataLoading, isCloud, error, isSyncing, refreshData, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead, unlockAudio, testNotification
    }), [appState, isDataLoading, isCloud, error, isSyncing, refreshData, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed, markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead, unlockAudio, testNotification]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within a DataProvider');
    return context;
};
