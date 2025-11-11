import React, { createContext, useState, useContext, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { User, Report, Role, Announcement } from '../types';

const MOCK_USERS: User[] = [
    { id: '1', fullName: 'وسام عبدالسلام جلوب', badgeNumber: 'MGR-001', username: 'admin', role: Role.MANAGER, password: 'admin', jobTitle: 'مسؤول شعبة الفنون والمسرح' },
    { id: '2', fullName: 'علي حسين عبيد', badgeNumber: '134', username: 'funun1', role: Role.EMPLOYEE, password: '0134', jobTitle: 'مسؤول وحدة', unit: 'وحدة التمكين الفني' },
    { id: '3', fullName: 'مثنى عبد علي شلش', badgeNumber: '238', username: 'funun2', role: Role.EMPLOYEE, password: '0238', jobTitle: 'حرفي أشغال يدوية', unit: 'وحدة التمكين الفني' },
    { id: '4', fullName: 'عقيل شاكر حسون', badgeNumber: '14146', username: 'funun3', role: Role.EMPLOYEE, password: '4146', jobTitle: 'حرفي أشغال يدوية', unit: 'وحدة التمكين الفني' },
    { id: '5', fullName: 'سجاد حسين مهدي', badgeNumber: '28010', username: 'funun4', role: Role.EMPLOYEE, password: '8010', jobTitle: 'رسام', unit: 'وحدة التمكين الفني' },
    { id: '6', fullName: 'حسن حسين شهيد', badgeNumber: '30508', username: 'funun5', role: Role.EMPLOYEE, password: '0508', jobTitle: 'فني فيلوغرافيا', unit: 'وحدة التمكين الفني' },
    { id: '7', fullName: 'علي ستار بزون', badgeNumber: '32761', username: 'funun6', role: Role.EMPLOYEE, password: '2761', jobTitle: 'فني فيلوغرافيا', unit: 'وحدة التمكين الفني' },
    { id: '8', fullName: 'سلام محمد عبد الرسول', badgeNumber: '13385', username: 'funun7', role: Role.EMPLOYEE, password: '3385', jobTitle: 'مسؤول وحدة', unit: 'وحدة التنسيق الفني' },
    { id: '9', fullName: 'حسين كاظم علي', badgeNumber: '27857', username: 'funun8', role: Role.EMPLOYEE, password: '7857', jobTitle: 'مصمم', unit: 'وحدة التنسيق الفني' },
    { id: '10', fullName: 'عبد الله عباس امين', badgeNumber: '17117', username: 'funun9', role: Role.EMPLOYEE, password: '7117', jobTitle: 'مساعد إنتاج', unit: 'وحدة التنسيق الفني' },
    { id: '11', fullName: 'حسين علي عباس', badgeNumber: '1818', username: 'funun10', role: Role.EMPLOYEE, password: '1818', jobTitle: 'مساعد إنتاج', unit: 'وحدة التنسيق الفني' },
    { id: '12', fullName: 'أياد عبد علي كريم', badgeNumber: '12616', username: 'funun11', role: Role.EMPLOYEE, password: '2616', jobTitle: 'مساعد إنتاج', unit: 'وحدة التنسيق الفني' },
    { id: '13', fullName: 'ليث حامد كاظم', badgeNumber: '22198', username: 'funun12', role: Role.EMPLOYEE, password: '2198', jobTitle: 'أمين مخزن', unit: 'وحدة التنسيق الفني' },
    { id: '14', fullName: 'عباس علي هادي', badgeNumber: '25279', username: 'funun13', role: Role.EMPLOYEE, password: '5279', jobTitle: 'مساعد تقني', unit: 'وحدة التنسيق الفني' },
    { id: '15', fullName: 'حسنين حميد حسين', badgeNumber: '15195', username: 'funun14', role: Role.EMPLOYEE, password: '5195', jobTitle: 'منتسب', unit: 'وحدة التنسيق الفني' },
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
                 
                // --- User data migration to fix login issues and add units ---
                const storedUsers = parsedData.users as User[];
                const updatedUsers = [...storedUsers];
                let hasChanges = false;

                MOCK_USERS.forEach(mockUser => {
                    const userIndex = storedUsers.findIndex(u => u.id === mockUser.id);
                    if (userIndex > -1) {
                        const storedUser = storedUsers[userIndex];
                        // Update if key fields don't match or unit is missing
                        if (
                            storedUser.username !== mockUser.username || 
                            storedUser.password !== mockUser.password ||
                            !storedUser.unit // Add unit if it's missing
                        ) {
                            updatedUsers[userIndex] = { ...storedUser, ...mockUser };
                            hasChanges = true;
                        }
                    } else {
                        updatedUsers.push(mockUser);
                        hasChanges = true;
                    }
                });
                
                if(hasChanges){
                    parsedData.users = updatedUsers;
                }
                // --- End of user data migration ---

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

    const addReport = useCallback((report: Omit<Report, 'id' | 'sequenceNumber'>) => {
        const userReportsCount = reports.filter(r => r.userId === report.userId).length;
        const newReport: Report = { 
            ...report, 
            id: `r${Date.now()}`,
            sequenceNumber: userReportsCount + 1,
            isViewedByManager: false,
            isCommentReadByEmployee: true, 
        };
        setReports(prev => [newReport, ...prev]);
    }, [reports]);

    const updateReport = useCallback((updatedReport: Report) => {
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
    }, [reports]);
    
    const markReportAsViewed = useCallback((reportId: string) => {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, isViewedByManager: true } : r));
    }, []);

    const markCommentAsRead = useCallback((reportId: string) => {
        setReports(prev => prev.map(r => r.id === reportId ? { ...r, isCommentReadByEmployee: true } : r));
    }, []);

    const addUser = useCallback((user: Omit<User, 'id'>) => {
        const newUser: User = { ...user, id: `u${Date.now()}`};
        setUsers(prev => [...prev, newUser]);
    }, []);

    const updateUser = useCallback((updatedUser: User) => {
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    }, []);

    const deleteUser = useCallback((userId: string) => {
        setUsers(prev => prev.filter(u => u.id !== userId));
        setReports(prev => prev.filter(r => r.userId !== userId));
    }, []);
    
    const addAnnouncement = useCallback((content: string) => {
        const newAnnouncement: Announcement = {
            id: `a${Date.now()}`,
            content,
            date: new Date().toISOString(),
            readBy: []
        };
        setAnnouncements(prev => [newAnnouncement, ...prev]);
    }, []);

    const updateAnnouncement = useCallback((announcementId: string, content: string) => {
        setAnnouncements(prev => prev.map(a => 
            a.id === announcementId 
            ? { ...a, content, date: new Date().toISOString() } 
            : a
        ));
    }, []);
    
    const deleteAnnouncement = useCallback((announcementId: string) => {
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    }, []);
    
    const markAnnouncementAsRead = useCallback((announcementId: string, userId: string) => {
        setAnnouncements(prev => prev.map(a => {
            if (a.id === announcementId && !a.readBy.some(entry => entry.userId === userId)) {
                return { ...a, readBy: [...a.readBy, { userId, readAt: new Date().toISOString() }] };
            }
            return a;
        }));
    }, []);

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
    }), [
        users, reports, announcements, getUserById, addReport, updateReport,
        markReportAsViewed, markCommentAsRead, addUser, updateUser, deleteUser,
        addAnnouncement, updateAnnouncement, deleteAnnouncement, markAnnouncementAsRead
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