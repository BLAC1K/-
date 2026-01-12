
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
        // استخدام رابط صوتي أكثر وضوحاً وتجهيزه
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audioRef.current.load();
    }, []);

    const unlockAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                if (audioRef.current) audioRef.current.currentTime = 0;
                console.log("Audio system unlocked successfully");
            }).catch(e => console.log("Audio unlock interaction needed", e));
        }
    }, []);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.6;
            audioRef.current.play().catch(e => console.warn("Sound blocked by browser policy", e));
        }
    }, []);

    const triggerNotification = useCallback((title: string, body: string, type: 'info' | 'success' = 'info') => {
        setNotification({ message: body, type, id: Date.now() });
        playNotificationSound();

        // نظام الاهتزاز للهواتف الذكية
        if ("vibrate" in navigator) {
            navigator.vibrate([100, 50, 100]);
        }

        // إشعار النظام (System Notification)
        if ("Notification" in window && Notification.permission === "granted") {
            // Fix: Cast options as 'any' to avoid 'vibrate' property error in NotificationOptions type definition
            const options: any = {
                body,
                icon: 'https://img.icons8.com/fluency/192/task.png',
                badge: 'https://img.icons8.com/fluency/48/task.png',
                vibrate: [200, 100, 200],
                tag: 'daily-tasks-alert',
                requireInteraction: false
            };
            
            try {
                // محاولة إرسال الإشعار عبر السيرفس وركر لضمان الظهور في الخلفية
                navigator.serviceWorker.ready.then(registration => {
                    registration.showNotification(title, options);
                }).catch(() => {
                    new Notification(title, options);
                });
            } catch (e) {
                console.warn("Local Notification API used as fallback", e);
            }
        }
    }, [playNotificationSound]);

    const testNotification = useCallback(() => {
        triggerNotification("تجربة التنبيهات", "هذا إشعار تجريبي للتأكد من عمل الصوت والاشعارات بشكل صحيح.", "success");
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
            console.error("Sync Error:", error);
            if (!silent) setError(error.message || "فشل الاتصال بقاعدة البيانات.");
        } finally {
            setIsDataLoading(false);
            setIsSyncing(false);
        }
    }, []);

    const refreshData = useCallback(async () => {
        await loadData(true);
    }, [loadData]);

    useEffect(() => {
        loadData();
        
        const unsubscribe = api.subscribeToAllChanges((payload) => {
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            
            setAppState(prev => {
                const newState = { ...prev };
                const loggedInUserId = localStorage.getItem('loggedInUserId') || sessionStorage.getItem('loggedInUserId');
                const currentUser = prev.users.find(u => u.id === loggedInUserId);

                if (table === 'reports') {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const mapped = api.mapReport(newRecord);
                        const oldReport = prev.reports.find(r => r.id === mapped.id);
                        
                        const existsIndex = prev.reports.findIndex(r => r.id === mapped.id);
                        if (existsIndex > -1) newState.reports = prev.reports.map(r => r.id === mapped.id ? mapped : r);
                        else newState.reports = [mapped, ...prev.reports];

                        if (eventType === 'INSERT' && mapped.status === 'submitted' && currentUser?.role === 'manager') {
                            const sender = prev.users.find(u => u.id === mapped.userId);
                            triggerNotification('تقرير جديد', `أرسل ${sender?.fullName.split(' ')[0]} تقريراً جديداً الآن.`);
                        }
                        
                        if (eventType === 'UPDATE' && mapped.userId === loggedInUserId && mapped.managerComment && mapped.managerComment !== oldReport?.managerComment) {
                            triggerNotification('توجيه إداري', 'وضع المسؤول ملاحظة جديدة على تقريرك.', 'success');
                        }
                    } else if (eventType === 'DELETE') {
                        newState.reports = prev.reports.filter(r => r.id !== oldRecord.id);
                    }
                } 
                else if (table === 'direct_tasks') {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const mapped = api.mapDirectTask(newRecord);
                        const existsIndex = prev.directTasks.findIndex(t => t.id === mapped.id);
                        
                        if (existsIndex > -1) newState.directTasks = prev.directTasks.map(t => t.id === mapped.id ? mapped : t);
                        else newState.directTasks = [mapped, ...prev.directTasks];

                        if (eventType === 'INSERT' && mapped.employeeId === loggedInUserId) {
                            triggerNotification('مهمة فورية', 'وصلتك مهمة عمل جديدة، يرجى الاطلاع.', 'info');
                        }

                        if (eventType === 'UPDATE' && mapped.managerId === loggedInUserId && mapped.status !== 'pending') {
                            const emp = prev.users.find(u => u.id === mapped.employeeId);
                            triggerNotification('تحديث مهمة', `تم الرد على المهمة من قبل ${emp?.fullName.split(' ')[0]}.`);
                        }
                    } else if (eventType === 'DELETE') {
                        newState.directTasks = prev.directTasks.filter(t => t.id !== oldRecord.id);
                    }
                } 
                else if (table === 'announcements') {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const mapped = api.mapAnnouncement(newRecord);
                        const existsIndex = prev.announcements.findIndex(a => a.id === mapped.id);
                        
                        if (existsIndex > -1) newState.announcements = prev.announcements.map(a => a.id === mapped.id ? mapped : a);
                        else newState.announcements = [mapped, ...prev.announcements];

                        if (eventType === 'INSERT') {
                            triggerNotification('تعميم عام', 'يوجد إعلان إداري جديد لجميع المنتسبين.', 'success');
                        }
                    } else if (eventType === 'DELETE') {
                        newState.announcements = prev.announcements.filter(a => a.id !== oldRecord.id);
                    }
                } 
                else if (table === 'users') {
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const mapped = api.mapUser(newRecord);
                        const existsIndex = prev.users.findIndex(u => u.id === mapped.id);
                        if (existsIndex > -1) newState.users = prev.users.map(u => u.id === mapped.id ? mapped : u);
                        else newState.users = [...prev.users, mapped];
                    } else if (eventType === 'DELETE') {
                        newState.users = prev.users.filter(u => u.id !== oldRecord.id);
                    }
                }

                return newState;
            });
        });

        return () => { unsubscribe(); };
    }, [loadData, triggerNotification]);
    
    const getUserById = useCallback((id: string) => appState.users.find(u => u.id === id), [appState.users]);

    const saveOrUpdateDraft = useCallback(async (draft: Partial<Report>) => {
        try { await api.saveOrUpdateDraft(draft); } catch (error) { throw error; }
    }, []);

    const addReport = useCallback(async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>) => {
        try { await api.createReport(report); } catch (error) { throw error; }
    }, []);

    const updateReport = useCallback(async (updatedReport: Report) => {
        try { await api.updateReport(updatedReport); } catch (error) { throw error; }
    }, []);

    const deleteReport = useCallback(async (reportId: string) => {
        try { await api.deleteReport(reportId); } catch (error) { throw error; }
    }, []);

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
        ...appState, isDataLoading, isCloud, error, isSyncing, refreshData, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead, unlockAudio, testNotification
    }), [
        appState, isDataLoading, isCloud, error, isSyncing, refreshData, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead, unlockAudio, testNotification
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
