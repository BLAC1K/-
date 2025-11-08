import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { User, Report, Role, Announcement } from '../types';

const MOCK_USERS: User[] = [
    { id: '1', fullName: 'وسام عبدالسلام جلوب', badgeNumber: 'MGR-001', phone: '01', role: Role.MANAGER, password: 'admin', jobTitle: 'مسؤول شعبة الفنون والمسرح' },
    { id: '2', fullName: 'حسين كاظم', badgeNumber: 'EMP-001', phone: '02', role: Role.EMPLOYEE, password: '1234', jobTitle: 'منتسب' },
];

const MOCK_REPORTS: Report[] = [];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'a1', content: 'تذكير: اجتماع الشعبة يوم الخميس الساعة 10 صباحاً.', date: '2024-07-28T10:00:00Z', readBy: [] },
];

const APP_STORAGE_KEY = 'dailyTasksAppData';

const getInitialState = () => {
    try {
        const storedData = localStorage.getItem(APP_STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            // Basic validation to ensure data structure is not completely off
            if (parsedData.users && parsedData.reports && parsedData.announcements) {
                 // Migrate old announcement structure if necessary
                 if (parsedData.announcements) {
                    parsedData.announcements = parsedData.announcements.map((ann: any) => {
                        // Check if readBy exists and needs migration (is an array of strings)
                        if (ann.readBy && ann.readBy.length > 0 && typeof ann.readBy[0] === 'string') {
                            return {
                                ...ann,
                                readBy: ann.readBy.map((userId: string) => ({
                                    userId,
                                    // Use announcement date as a fallback for readAt for old data
                                    readAt: ann.date 
                                }))
                            };
                        }
                        // Ensure readBy is an array even if it's missing from old data
                        if (!ann.readBy) {
                            return { ...ann, readBy: [] };
                        }
                        return ann;
                    });
                }
                return parsedData;
            }
        }
    } catch (error) {
        console.error("Failed to read from localStorage", error);
    }
    return {
        users: MOCK_USERS,
        reports: MOCK_REPORTS,
        announcements: MOCK_ANNOUNCEMENTS,
    };
};


interface DataContextType {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    getUserById: (id: string) => User | undefined;
    addReport: (report: Omit<Report, 'id' | 'sequenceNumber'>) => void;
    updateReport: (updatedReport: Report) => void;
    markReportAsViewed: (reportId: string) => void;
    markCommentAsRead: (reportId: string) => void;
    addUser: (user: Omit<User, 'id'>) => void;
    updateUser: (user: User) => void;
    deleteUser: (userId: string) => void;
    addAnnouncement: (content: string) => void;
    updateAnnouncement: (announcementId: string, content: string) => void;
    deleteAnnouncement: (announcementId: string) => void;
    markAnnouncementAsRead: (announcementId: string, userId: string) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const initialState = getInitialState();
    const [users, setUsers] = useState<User[]>(initialState.users);
    const [reports, setReports] = useState<Report[]>(initialState.reports);
    const [announcements, setAnnouncements] = useState<Announcement[]>(initialState.announcements);

    useEffect(() => {
        try {
            localStorage.setItem(APP_STORAGE_KEY, JSON.stringify({ users, reports, announcements }));
        } catch (error) {
            console.error("Could not save app state to localStorage", error);
        }
    }, [users, reports, announcements]);


    const getUserById = useCallback((id: string) => users.find(u => u.id === id), [users]);

    const addReport = (report: Omit<Report, 'id' | 'sequenceNumber'>) => {
        const userReportsCount = reports.filter(r => r.userId === report.userId).length;
        const newReport: Report = { 
            ...report, 
            id: `r${Date.now()}`,
            sequenceNumber: userReportsCount + 1,
            isViewedByManager: false,
            isCommentReadByEmployee: true, 
        };
        setReports(prev => [newReport, ...prev]);
    };

    const updateReport = (updatedReport: Report) => {
        const originalReport = reports.find(r => r.id === updatedReport.id);
        if (originalReport && updatedReport.managerComment && originalReport.managerComment !== updatedReport.managerComment) {
            updatedReport.isCommentReadByEmployee = false;
            // Fire real-time notification event
            const notificationPayload = {
                userId: updatedReport.userId,
                reportId: updatedReport.id,
                timestamp: Date.now(),
                message: `لديك تعليق جديد من المسؤول على تقريرك بتاريخ ${updatedReport.date}.`
            };
            localStorage.setItem('comment_notification', JSON.stringify(notificationPayload));
        }
        setReports(prev => prev.map(r => r.id === updatedReport.id ? updatedReport : r));
    };
    
    const markReportAsViewed = (reportId: string) => {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, isViewedByManager: true } : r));
    };

    const markCommentAsRead = (reportId: string) => {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, isCommentReadByEmployee: true } : r));
    };

    const addUser = (user: Omit<User, 'id'>) => {
        const newUser: User = { ...user, id: `u${Date.now()}`};
        setUsers(prev => [...prev, newUser]);
    };

    const updateUser = (updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    };

    const deleteUser = (userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setReports(prev => prev.filter(r => r.userId !== userId));
    };
    
    const addAnnouncement = (content: string) => {
        const newAnnouncement: Announcement = {
            id: `a${Date.now()}`,
            content,
            date: new Date().toISOString(),
            readBy: []
        };
        setAnnouncements(prev => [newAnnouncement, ...prev]);
    };

    const updateAnnouncement = (announcementId: string, content: string) => {
        setAnnouncements(prev => prev.map(a => 
            a.id === announcementId 
            ? { ...a, content, date: new Date().toISOString() } 
            : a
        ));
    };
    
    const deleteAnnouncement = (announcementId: string) => {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    };
    
    const markAnnouncementAsRead = (announcementId: string, userId: string) => {
        setAnnouncements(prev => prev.map(a => {
            if (a.id === announcementId && !a.readBy.some(entry => entry.userId === userId)) {
                return { ...a, readBy: [...a.readBy, { userId, readAt: new Date().toISOString() }] };
            }
            return a;
        }));
    };

    const value = useMemo(() => ({
        users,
        reports,
        announcements,
        getUserById,
        addReport,
        updateReport,
        markReportAsViewed,
        markCommentAsRead,
        addUser,
        updateUser,
        deleteUser,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        markAnnouncementAsRead
    }), [users, reports, announcements, getUserById]);

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