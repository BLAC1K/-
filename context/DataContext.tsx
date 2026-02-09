
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
    submitReport: (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>, draftId?: string) => Promise<void>;
    updateReport: (updatedReport: Report) => Promise<void>;
    saveOrUpdateDraft: (draft: Partial<Report>) => Promise<void>;
    deleteReport: (reportId: string) => Promise<void>;
    markReportAsViewed: (reportId: string) => Promise<void>;
    markAllReportsAsReadForUser: (userId: string) => Promise<void>;
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
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3');
        audioRef.current.load();
    }, []);

    const unlockAudio = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current?.pause();
                if (audioRef.current) audioRef.current.currentTime = 0;
            }).catch(e => console.log("Audio interaction needed"));
        }
    }, []);

    const playNotificationSound = useCallback(() => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.volume = 0.6;
            audioRef.current.play().catch(e => console.warn("Sound blocked"));
        }
    }, []);

    const triggerNotification = useCallback((title: string, body: string, type: 'info' | 'success' = 'info') => {
        setNotification({ message: body, type, id: Date.now() });
        playNotificationSound();
        
        if ("vibrate" in navigator) {
            navigator.vibrate([100, 50, 100]);
        }

        if ("Notification" in window && Notification.permission === "granted") {
            const options: any = {
                body,
                icon: 'https://img.icons8.com/fluency/192/task.png',
                vibrate: [200, 100, 200],
            };
            navigator.serviceWorker.ready.then(reg => reg.showNotification(title, options));
        }
    }, [playNotificationSound]);

    const testNotification = useCallback(() => {
        triggerNotification("تجربة النظام", "أهلاً بك، نظام التنبيهات يعمل بنجاح.", "success");
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
            if (!silent) setError(error.message || "خطأ اتصال.");
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
        const unsubscribe = api.subscribeToAllChanges(async (payload) => {
            const { table, eventType, new: newRecord, old: oldRecord } = payload;
            const loggedInUserId = localStorage.getItem('loggedInUserId') || sessionStorage.getItem('loggedInUserId');
            
            // Robust Realtime Handling: Fetch full fresh object instead of relying on payload
            if (table === 'reports') {
                if (eventType === 'DELETE') {
                    setAppState(prev => ({...prev, reports: prev.reports.filter(r => r.id !== oldRecord.id)}));
                } else {
                    const freshReport = await api.fetchReportById(newRecord.id);
                    if (freshReport) {
                        setAppState(prev => {
                            const exists = prev.reports.some(r => r.id === freshReport.id);
                            // Detect Changes for Notifications
                            const currentUser = prev.users.find(u => u.id === loggedInUserId);
                            const oldReport = prev.reports.find(r => r.id === freshReport.id);
                            
                            // Manager Notification for New Report
                            if (eventType === 'INSERT' && freshReport.status === 'submitted' && currentUser?.role === 'manager') {
                                const sender = prev.users.find(u => u.id === freshReport.userId);
                                triggerNotification('تقرير جديد', `وصل تقرير جديد من ${sender?.fullName.split(' ')[0]}`, 'success');
                            }
                            
                            // Employee Notification for Manager Comment/Ack
                            if (eventType === 'UPDATE' && currentUser && currentUser.id === freshReport.userId) {
                                const oldComment = oldReport?.managerComment;
                                const newComment = freshReport.managerComment;
                                if (newComment && newComment.trim().length > 0 && newComment !== oldComment) {
                                     triggerNotification('توجيه إداري جديد', `تم إضافة توجيه/اطلاع على تقريرك بتاريخ ${freshReport.date}`, 'info');
                                }
                            }

                            const newReports = exists 
                                ? prev.reports.map(r => r.id === freshReport.id ? freshReport : r)
                                : [freshReport, ...prev.reports];
                            
                            return {...prev, reports: newReports.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())};
                        });
                    }
                }
            } else if (table === 'direct_tasks') {
                 if (eventType === 'DELETE') {
                    setAppState(prev => ({...prev, directTasks: prev.directTasks.filter(t => t.id !== oldRecord.id)}));
                 } else {
                     const freshTask = await api.fetchDirectTaskById(newRecord.id);
                     if (freshTask) {
                         setAppState(prev => {
                             const exists = prev.directTasks.some(t => t.id === freshTask.id);
                             const currentUser = prev.users.find(u => u.id === loggedInUserId);

                             if (!exists && currentUser && freshTask.employeeId === currentUser.id) {
                                 const manager = prev.users.find(u => u.id === freshTask.managerId);
                                 triggerNotification('مهمة جديدة', `وصلتك مهمة جديدة من ${manager?.fullName || 'المسؤول'}`, 'info');
                             }

                             const newTasks = exists 
                                ? prev.directTasks.map(t => t.id === freshTask.id ? freshTask : t)
                                : [freshTask, ...prev.directTasks];
                             return {...prev, directTasks: newTasks.sort((a,b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime())};
                         });
                     }
                 }
            } else if (table === 'announcements') {
                 if (eventType === 'DELETE') {
                    setAppState(prev => ({...prev, announcements: prev.announcements.filter(a => a.id !== oldRecord.id)}));
                 } else {
                     const freshAnn = await api.fetchAnnouncementById(newRecord.id);
                     if (freshAnn) {
                         setAppState(prev => {
                             const exists = prev.announcements.some(a => a.id === freshAnn.id);
                             const currentUser = prev.users.find(u => u.id === loggedInUserId);
                             
                             if (!exists && currentUser && currentUser.role === 'employee') {
                                 triggerNotification('توجيه عام جديد', 'تم نشر توجيه عام جديد من الإدارة', 'info');
                             }

                             const newAnns = exists
                                ? prev.announcements.map(a => a.id === freshAnn.id ? freshAnn : a)
                                : [freshAnn, ...prev.announcements];
                             return {...prev, announcements: newAnns.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())};
                         });
                     }
                 }
            } else if (table === 'users') {
                 if (eventType === 'INSERT' || eventType === 'UPDATE') {
                     const mappedUser = api.mapUser(newRecord);
                     setAppState(prev => ({
                         ...prev,
                         users: prev.users.some(u => u.id === mappedUser.id) ? prev.users.map(u => u.id === mappedUser.id ? mappedUser : u) : [...prev.users, mappedUser]
                     }));
                 }
            }
        });
        return () => { unsubscribe(); };
    }, [loadData, triggerNotification]);
    
    const getUserById = useCallback((id: string) => appState.users.find(u => u.id === id), [appState.users]);
    const saveOrUpdateDraft = useCallback(async (draft: Partial<Report>) => { try { await api.saveOrUpdateDraft(draft); } catch (e) { throw e; } }, []);
    const addReport = useCallback(async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>) => { try { await api.createReport(report); } catch (e) { throw e; } }, []);
    const submitReport = useCallback(async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>, draftId?: string) => { try { await api.submitReport(report, draftId); } catch (e) { throw e; } }, []);
    const updateReport = useCallback(async (updatedReport: Report) => { try { await api.updateReport(updatedReport); } catch (e) { throw e; } }, []);
    const deleteReport = useCallback(async (reportId: string) => { try { await api.deleteReport(reportId); } catch (e) { throw e; } }, []);
    const markReportAsViewed = useCallback(async (reportId: string) => { 
        setAppState(prev => ({
            ...prev,
            reports: prev.reports.map(r => r.id === reportId ? { ...r, isViewedByManager: true } : r)
        }));
        await api.markReportAsViewed(reportId); 
    }, []);
    const markAllReportsAsReadForUser = useCallback(async (userId: string) => { 
        setAppState(prev => ({
            ...prev,
            reports: prev.reports.map(r => r.userId === userId ? { ...r, isViewedByManager: true } : r)
        }));
        await api.markAllReportsAsReadForUser(userId); 
    }, []);
    const markCommentAsRead = useCallback(async (reportId: string) => { await api.markCommentAsRead(reportId); }, []);
    const addUser = useCallback(async (user: Omit<User, 'id'>) => api.createUser(user), []);
    const updateUser = useCallback(async (updatedUser: User) => api.updateUser(updatedUser), []);
    const deleteUser = useCallback(async (userId: string) => api.deleteUser(userId), []);
    const addAnnouncement = useCallback(async (content: string) => api.createAnnouncement(content), []);
    const updateAnnouncement = useCallback(async (annId: string, content: string) => api.updateAnnouncement(annId, content), []);
    const deleteAnnouncement = useCallback(async (annId: string) => api.deleteAnnouncement(annId), []);
    const markAnnouncementAsRead = useCallback(async (annId: string, uId: string) => api.markAnnouncementAsRead(annId, uId), []);
    const addDirectTask = useCallback(async (task: any) => api.createDirectTask(task), []);
    const updateDirectTaskStatus = useCallback(async (tId: string, s: any, r?: string) => api.updateDirectTaskStatus(tId, s, r), []);
    const markDirectTaskAsRead = useCallback(async (tId: string) => api.markDirectTaskAsRead(tId), []);

    const value = useMemo(() => ({
        ...appState, isDataLoading, isCloud, error, isSyncing, refreshData, notification, clearNotification, getUserById, 
        addReport, submitReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed, markAllReportsAsReadForUser,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead, unlockAudio, testNotification
    }), [appState, isDataLoading, isCloud, error, isSyncing, refreshData, notification, clearNotification, getUserById, 
        addReport, submitReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed, markAllReportsAsReadForUser,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead, unlockAudio, testNotification]);

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData error');
    return context;
};
