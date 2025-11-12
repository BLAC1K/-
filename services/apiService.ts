import { User, Report, Role, Announcement, DirectTask } from '../types';

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
const MOCK_DIRECT_TASKS: DirectTask[] = [];

const APP_STORAGE_KEY = 'dailyTasksAppData';
const LATENCY = 150; // ms

interface AppState {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    directTasks: DirectTask[];
}

// --- Data Access and Migration ---
const getFullState = (): AppState => {
    try {
        const storedData = localStorage.getItem(APP_STORAGE_KEY);
        if (storedData) {
            const parsedData = JSON.parse(storedData);
            if (parsedData.users && parsedData.reports && parsedData.announcements) {
                // Perform migrations on the loaded data
                const storedUsers = parsedData.users as User[];
                const updatedUsers = [...storedUsers];
                let hasChanges = false;
                MOCK_USERS.forEach(mockUser => {
                    const userIndex = storedUsers.findIndex(u => u.id === mockUser.id);
                    if (userIndex > -1) {
                        const storedUser = storedUsers[userIndex];
                        if (storedUser.username !== mockUser.username || storedUser.password !== mockUser.password || !storedUser.unit) {
                            updatedUsers[userIndex] = { ...storedUser, ...mockUser };
                            hasChanges = true;
                        }
                    } else {
                        updatedUsers.push(mockUser);
                        hasChanges = true;
                    }
                });
                if (hasChanges) parsedData.users = updatedUsers;

                if (parsedData.announcements) {
                    parsedData.announcements = parsedData.announcements.map((ann: any) => {
                        if (ann.readBy && ann.readBy.length > 0 && typeof ann.readBy[0] === 'string') {
                            return { ...ann, readBy: ann.readBy.map((userId: string) => ({ userId, readAt: ann.date })) };
                        }
                        if (!ann.readBy) return { ...ann, readBy: [] };
                        return ann;
                    });
                }
                if (!parsedData.directTasks) parsedData.directTasks = MOCK_DIRECT_TASKS;
                if (parsedData.reports) {
                    parsedData.reports = parsedData.reports.map((report: Report) => ({ ...report, status: report.status || 'submitted' }));
                }
                return parsedData;
            }
        }
    } catch (error) {
        console.error("Failed to read from localStorage", error);
    }
    return { users: MOCK_USERS, reports: MOCK_REPORTS, announcements: MOCK_ANNOUNCEMENTS, directTasks: MOCK_DIRECT_TASKS };
};

const saveFullState = (state: AppState) => {
    try {
        localStorage.setItem(APP_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Could not save app state to localStorage", error);
    }
};

const simulateAPICall = <T,>(action: () => T): Promise<T> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const result = action();
            resolve(result);
        }, LATENCY);
    });
};

// --- API Service Functions ---

export const fetchInitialData = async (): Promise<AppState> => {
    return simulateAPICall(getFullState);
};

// REPORTS
export const createReport = async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>): Promise<Report> => {
    return simulateAPICall(() => {
        const state = getFullState();
        const userReportsCount = state.reports.filter(r => r.userId === report.userId && r.status === 'submitted').length;
        const newReport: Report = { 
            ...report, 
            id: `r${Date.now()}`,
            sequenceNumber: userReportsCount + 1,
            isViewedByManager: false,
            isCommentReadByEmployee: true, 
            status: 'submitted',
        };
        state.reports = [newReport, ...state.reports];
        saveFullState(state);
        return newReport;
    });
};

export const updateReport = async (updatedReport: Report): Promise<Report> => {
    return simulateAPICall(() => {
        const state = getFullState();
        const originalReport = state.reports.find(r => r.id === updatedReport.id);
        
        if (updatedReport.status === 'submitted' && originalReport?.status === 'draft') {
             const userReportsCount = state.reports.filter(r => r.userId === updatedReport.userId && r.status === 'submitted').length;
             updatedReport.sequenceNumber = userReportsCount + 1;
        }

        if (originalReport && updatedReport.managerComment && originalReport.managerComment !== updatedReport.managerComment) {
            updatedReport.isCommentReadByEmployee = false;
            const notificationPayload = {
                userId: updatedReport.userId,
                reportId: updatedReport.id,
                timestamp: Date.now(),
                message: `لديك تعليق جديد من المسؤول على تقريرك بتاريخ ${updatedReport.date}.`
            };
            localStorage.setItem('comment_notification', JSON.stringify(notificationPayload));
        }

        state.reports = state.reports.map(r => r.id === updatedReport.id ? updatedReport : r);
        saveFullState(state);
        return updatedReport;
    });
};

export const saveOrUpdateDraft = async (draft: Partial<Report>): Promise<Report> => {
    return simulateAPICall(() => {
        const state = getFullState();
        let savedDraft: Report;
        if (draft.id) {
             const existingIndex = state.reports.findIndex(r => r.id === draft.id);
             savedDraft = { ...state.reports[existingIndex], ...draft, status: 'draft' };
             state.reports[existingIndex] = savedDraft;
        } else {
            savedDraft = {
                ...(draft as Omit<Report, 'id'|'status'>),
                id: `d${Date.now()}`,
                status: 'draft',
            };
            state.reports = [savedDraft, ...state.reports];
        }
        saveFullState(state);
        return savedDraft;
    });
};

export const deleteReport = async (reportId: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.reports = state.reports.filter(r => r.id !== reportId);
        saveFullState(state);
    });
};
    
export const markReportAsViewed = async (reportId: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.reports = state.reports.map(r => r.id === reportId ? { ...r, isViewedByManager: true } : r);
        saveFullState(state);
    });
};

export const markCommentAsRead = async (reportId: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.reports = state.reports.map(r => r.id === reportId ? { ...r, isCommentReadByEmployee: true } : r);
        saveFullState(state);
    });
};

// USERS
export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    return simulateAPICall(() => {
        const state = getFullState();
        const newUser: User = { ...user, id: `u${Date.now()}`};
        state.users = [...state.users, newUser];
        saveFullState(state);
        return newUser;
    });
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.users = state.users.map(u => u.id === updatedUser.id ? updatedUser : u);
        saveFullState(state);
        return updatedUser;
    });
};

export const deleteUser = async (userId: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.users = state.users.filter(u => u.id !== userId);
        state.reports = state.reports.filter(r => r.userId !== userId);
        saveFullState(state);
    });
};
    
// ANNOUNCEMENTS
export const createAnnouncement = async (content: string): Promise<Announcement> => {
    return simulateAPICall(() => {
        const state = getFullState();
        const newAnnouncement: Announcement = {
            id: `a${Date.now()}`,
            content,
            date: new Date().toISOString(),
            readBy: []
        };
        state.announcements = [newAnnouncement, ...state.announcements];
        saveFullState(state);
        return newAnnouncement;
    });
};

export const updateAnnouncement = async (announcementId: string, content: string): Promise<Announcement> => {
    return simulateAPICall(() => {
        const state = getFullState();
        let updatedAnnouncement: Announcement | undefined;
        state.announcements = state.announcements.map(a => {
            if (a.id === announcementId) {
                updatedAnnouncement = { ...a, content, date: new Date().toISOString() };
                return updatedAnnouncement;
            }
            return a;
        });
        saveFullState(state);
        if (!updatedAnnouncement) throw new Error("Announcement not found");
        return updatedAnnouncement;
    });
};
    
export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.announcements = state.announcements.filter(a => a.id !== announcementId);
        saveFullState(state);
    });
};
    
export const markAnnouncementAsRead = async (announcementId: string, userId: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.announcements = state.announcements.map(a => {
            if (a.id === announcementId && !a.readBy.some(entry => entry.userId === userId)) {
                return { ...a, readBy: [...a.readBy, { userId, readAt: new Date().toISOString() }] };
            }
            return a;
        });
        saveFullState(state);
    });
};

// DIRECT TASKS
export const createDirectTask = async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>): Promise<DirectTask> => {
    return simulateAPICall(() => {
        const state = getFullState();
        const newDirectTask: DirectTask = {
            ...task,
            id: `dt-${Date.now()}`,
            sentAt: new Date().toISOString(),
            status: 'pending',
            isReadByEmployee: false
        };
        state.directTasks = [newDirectTask, ...state.directTasks];
        saveFullState(state);
        const notificationPayload = {
            userId: task.employeeId,
            taskId: newDirectTask.id,
            timestamp: Date.now(),
            message: `لديك مهمة جديدة من المسؤول.`
        };
        localStorage.setItem('task_notification', JSON.stringify(notificationPayload));
        return newDirectTask;
    });
};

export const updateDirectTaskStatus = async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.directTasks = state.directTasks.map(task => {
            if (task.id === taskId) {
                return {
                    ...task,
                    status,
                    rejectionReason: rejectionReason,
                    acknowledgedAt: new Date().toISOString(),
                    isReadByEmployee: true
                };
            }
            return task;
        });
        saveFullState(state);
    });
};
    
export const markDirectTaskAsRead = async (taskId: string): Promise<void> => {
    return simulateAPICall(() => {
        const state = getFullState();
        state.directTasks = state.directTasks.map(task => 
            task.id === taskId ? { ...task, isReadByEmployee: true } : task
        );
        saveFullState(state);
    });
};
