
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
    const [isCloud, setIsCloud] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ message: string, type: 'info' | 'success', id: number } | null>(null);
    
    const currentUserIdRef = useRef<string | null>(null);

    const clearNotification = useCallback(() => setNotification(null), []);

    const loadData = useCallback(async (silent = false) => {
        if (!silent) setIsDataLoading(true);
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

    useEffect(() => {
        loadData();

        // استرجاع المعرف الحالي من التخزين لمقارنته في التنبيهات
        currentUserIdRef.current = localStorage.getItem('loggedInUserId') || sessionStorage.getItem('loggedInUserId');

        const unsubscribe = api.subscribeToAllChanges((payload) => {
            const { table, eventType, new: newRecord, old: oldRecord } = payload;

            setAppState(prev => {
                const newState = { ...prev };

                if (table === 'reports') {
                    const mapped = api.mapReport(newRecord);
                    if (eventType === 'INSERT' || eventType === 'UPDATE') {
                        const exists = prev.reports.findIndex(r => r.id === mapped.id);
                        if (exists > -1) {
                            newState.reports = prev.reports.map(r => r.id === mapped.id ? mapped : r);
                        } else {
                            newState.reports = [mapped, ...prev.reports];
                        }
                    }
                    else if (eventType === 'DELETE') {
                        newState.reports = prev.reports.filter(r => r.id !== oldRecord.id);
                    }
                }
                else if (table === 'direct_tasks') {
                    const mapped = api.mapDirectTask(newRecord);
                    if (eventType === 'INSERT') {
                        newState.directTasks = [mapped, ...prev.directTasks];
                        // تنبيه المستخدم إذا كانت المهمة موجهة له
                        if (mapped.employeeId === currentUserIdRef.current) {
                            setNotification({ message: 'وصلتك مهمة عمل جديدة!', type: 'info', id: Date.now() });
                        }
                    }
                    else if (eventType === 'UPDATE') newState.directTasks = prev.directTasks.map(t => t.id === mapped.id ? mapped : t);
                    else if (eventType === 'DELETE') newState.directTasks = prev.directTasks.filter(t => t.id !== oldRecord.id);
                }
                else if (table === 'announcements') {
                    const mapped = api.mapAnnouncement(newRecord);
                    if (eventType === 'INSERT') {
                        newState.announcements = [mapped, ...prev.announcements];
                        setNotification({ message: 'توجيه إداري جديد للجميع.', type: 'info', id: Date.now() });
                    }
                    else if (eventType === 'UPDATE') newState.announcements = prev.announcements.map(a => a.id === mapped.id ? mapped : a);
                    else if (eventType === 'DELETE') newState.announcements = prev.announcements.filter(a => a.id !== oldRecord.id);
                }
                else if (table === 'users') {
                    const mapped = api.mapUser(newRecord);
                    if (eventType === 'INSERT') newState.users = [...prev.users, mapped];
                    else if (eventType === 'UPDATE') newState.users = prev.users.map(u => u.id === mapped.id ? mapped : u);
                    else if (eventType === 'DELETE') newState.users = prev.users.filter(u => u.id !== oldRecord.id);
                }

                return newState;
            });
        });

        return () => { unsubscribe(); };
    }, [loadData]);
    
    const getUserById = useCallback((id: string) => appState.users.find(u => u.id === id), [appState.users]);

    const saveOrUpdateDraft = useCallback(async (draft: Partial<Report>) => {
        // تحديث فوري محلي (Optimistic UI)
        const tempId = draft.id || `temp-${Date.now()}`;
        const tempDraft = {
            id: tempId,
            status: 'draft',
            userId: draft.userId,
            date: draft.date,
            day: draft.day,
            tasks: draft.tasks || [],
            accomplished: draft.accomplished || '',
            notAccomplished: draft.notAccomplished || '',
            attachments: draft.attachments || [],
            isViewedByManager: false,
            isCommentReadByEmployee: false
        } as Report;

        setAppState(prev => {
            const exists = prev.reports.find(r => r.id === draft.id);
            if (exists) {
                return { ...prev, reports: prev.reports.map(r => r.id === draft.id ? { ...r, ...tempDraft } : r) };
            }
            return { ...prev, reports: [tempDraft, ...prev.reports] };
        });

        try {
            await api.saveOrUpdateDraft(draft);
        } catch (error) {
            loadData(true);
            throw error;
        }
    }, [loadData]);

    const addReport = useCallback(async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>) => {
        try {
            await api.createReport(report);
        } catch (error) { throw error; }
    }, []);

    const updateReport = useCallback(async (updatedReport: Report) => {
        setAppState(prev => ({
            ...prev,
            reports: prev.reports.map(r => r.id === updatedReport.id ? updatedReport : r)
        }));
        try { await api.updateReport(updatedReport); } catch (error) { loadData(true); throw error; }
    }, [loadData]);

    const deleteReport = useCallback(async (reportId: string) => {
        setAppState(prev => ({
            ...prev,
            reports: prev.reports.filter(r => r.id !== reportId)
        }));
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
        ...appState, isDataLoading, isCloud, error, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
        markCommentAsRead, addUser, updateUser, deleteUser, addAnnouncement, updateAnnouncement, deleteAnnouncement,
        markAnnouncementAsRead, addDirectTask, updateDirectTaskStatus, markDirectTaskAsRead
    }), [
        appState, isDataLoading, isCloud, error, notification, clearNotification, getUserById, addReport, updateReport, saveOrUpdateDraft, deleteReport, markReportAsViewed,
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
