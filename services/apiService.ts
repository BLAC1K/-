
import { User, Report, Announcement, DirectTask, Role } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseConfig';

// Define the shape of our data
interface AppState {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    directTasks: DirectTask[];
    isCloud: boolean; // Flag to indicate data source
}

// Initial Data to seed the application
const INITIAL_USERS: User[] = [
    {
        id: 'u1',
        fullName: 'وسام عبد السلام جلوب',
        badgeNumber: '12637',
        username: 'wissam',
        password: '123',
        role: Role.MANAGER,
        jobTitle: 'مسؤول شعبة',
        unit: 'الإدارة'
    },
    {
        id: 'u2',
        fullName: 'علي حسين عبيد',
        badgeNumber: '134',
        username: 'ali134',
        password: '123',
        role: Role.EMPLOYEE,
        jobTitle: 'مسؤول وحدة',
        unit: 'وحدة التمكين الفني'
    },
    {
        id: 'u3',
        fullName: 'سلام محمد عبد الرسول',
        badgeNumber: '13385',
        username: 'salam',
        password: '123',
        role: Role.EMPLOYEE,
        jobTitle: 'مسؤول وحدة',
        unit: 'وحدة التنسيق الفني'
    },
    { id: 'u4', fullName: 'عقيل شاكر حسون', badgeNumber: '14146', username: 'aqeel', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التمكين الفني' },
    { id: 'u5', fullName: 'مثنى عبد علي شلش', badgeNumber: '237', username: 'muthanna', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التنسيق الفني' },
    { id: 'u6', fullName: 'ليث حامد كاظم', badgeNumber: '22198', username: 'laith', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التمكين الفني' },
    { id: 'u7', fullName: 'حسين علي عباس', badgeNumber: '1818', username: 'hussain1818', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التنسيق الفني' },
    { id: 'u8', fullName: 'حسنين حميد حسين', badgeNumber: '15195', username: 'hassanin', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التمكين الفني' },
    { id: 'u9', fullName: 'اياد عبد علي كريم', badgeNumber: '12616', username: 'ayad', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التنسيق الفني' },
    { id: 'u10', fullName: 'سجاد حسين مهدي', badgeNumber: '28010', username: 'sajjad', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التمكين الفني' },
    { id: 'u11', fullName: 'عباس علي هادي', badgeNumber: '25279', username: 'abbas', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التنسيق الفني' },
    { id: 'u12', fullName: 'حسن حسين شهيد', badgeNumber: '30508', username: 'hassan', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التمكين الفني' },
    { id: 'u13', fullName: 'حسين كاظم علي', badgeNumber: '27857', username: 'hussain27857', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التنسيق الفني' },
    { id: 'u14', fullName: 'علي ستار بزون', badgeNumber: '32761', username: 'ali32761', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التمكين الفني' },
    { id: 'u15', fullName: 'عبد الله عباس امين', badgeNumber: '17117', username: 'abdullah', password: '123', role: Role.EMPLOYEE, jobTitle: 'موظف', unit: 'وحدة التنسيق الفني' },
];


// Helper: Generate ID (UUID-like)
const generateId = () => crypto.randomUUID();

// ============================================================================
// LOCAL STORAGE IMPLEMENTATION (Fallback)
// ============================================================================

const STORAGE_KEY = 'daily_tasks_app_data_v2';

const loadFromLocalStorage = (): AppState => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let state: Omit<AppState, 'isCloud'>;
    
    if (stored) {
        state = JSON.parse(stored);
    } else {
        // Default initial state
        state = {
            users: INITIAL_USERS,
            reports: [],
            announcements: [],
            directTasks: []
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
    
    return { ...state, isCloud: false };
};

const saveToLocalStorage = (state: AppState) => {
    // We don't save isCloud to storage
    const { isCloud, ...stateToSave } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
};

// ============================================================================
// SUPABASE MAPPERS
// ============================================================================

const mapUser = (row: any): User => ({
    id: row.id,
    fullName: row.full_name,
    badgeNumber: row.badge_number,
    username: row.username,
    password: row.password,
    role: row.role as Role,
    jobTitle: row.job_title,
    unit: row.unit,
    profilePictureUrl: row.profile_picture_url
});

const mapReport = (row: any): Report => ({
    id: row.id,
    userId: row.user_id,
    sequenceNumber: row.sequence_number,
    date: row.date,
    day: row.day,
    tasks: row.tasks || [],
    accomplished: row.accomplished,
    notAccomplished: row.not_accomplished,
    attachments: row.attachments || [],
    managerComment: row.manager_comment,
    isViewedByManager: row.is_viewed_by_manager,
    isCommentReadByEmployee: row.is_comment_read_by_employee,
    rating: row.rating,
    status: row.status
});

const mapAnnouncement = (row: any): Announcement => ({
    id: row.id,
    content: row.content,
    date: row.date,
    readBy: row.read_by || []
});

const mapDirectTask = (row: any): DirectTask => ({
    id: row.id,
    managerId: row.manager_id,
    employeeId: row.employee_id,
    content: row.content,
    sentAt: row.sent_at,
    status: row.status,
    acknowledgedAt: row.acknowledged_at,
    rejectionReason: row.rejection_reason,
    isReadByEmployee: row.is_read_by_employee
});

// ============================================================================
// API FUNCTIONS (Hybrid)
// ============================================================================

export const fetchInitialData = async (): Promise<AppState> => {
    if (!isSupabaseConfigured()) {
        console.warn('Supabase not configured. Using Local Storage.');
        return loadFromLocalStorage();
    }

    try {
        // Fetch Users
        const { data: usersData, error: usersError } = await supabase.from('users').select('*');
        if (usersError) throw usersError;

        let users: User[] = usersData.map(mapUser);

        // Seed initial users if database is empty (First time run)
        if (users.length === 0) {
            console.log("Seeding Database with initial users...");
            const dbUsers = INITIAL_USERS.map(u => ({
                id: u.id,
                full_name: u.fullName,
                badge_number: u.badgeNumber,
                username: u.username,
                password: u.password,
                role: u.role,
                job_title: u.jobTitle,
                unit: u.unit
            }));
            
            const { error: seedError } = await supabase.from('users').insert(dbUsers);
            if (seedError) console.error("Error seeding users:", seedError);
            else users = INITIAL_USERS;
        }

        // Fetch Reports
        const { data: reportsData, error: reportsError } = await supabase.from('reports').select('*');
        if (reportsError) throw reportsError;
        const reports: Report[] = reportsData.map(mapReport);

        // Fetch Announcements
        const { data: annData, error: annError } = await supabase.from('announcements').select('*');
        if (annError) throw annError;
        const announcements: Announcement[] = annData.map(mapAnnouncement);

        // Fetch Direct Tasks
        const { data: tasksData, error: tasksError } = await supabase.from('direct_tasks').select('*');
        if (tasksError) throw tasksError;
        const directTasks: DirectTask[] = tasksData.map(mapDirectTask);

        return { users, reports, announcements, directTasks, isCloud: true };

    } catch (error) {
        console.error("Error fetching data from Supabase:", error);
        // Fallback to local storage on error to keep app usable
        return loadFromLocalStorage(); 
    }
};

// --- REPORTS ---

export const createReport = async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>): Promise<Report> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        const maxSeq = Math.max(0, ...state.reports.map(r => r.sequenceNumber || 0));
        const newReport: Report = {
            ...report,
            id: generateId(),
            sequenceNumber: maxSeq + 1,
            status: 'submitted',
            isViewedByManager: false,
            isCommentReadByEmployee: false
        };
        state.reports.push(newReport);
        saveToLocalStorage({ ...state, isCloud: false });
        return newReport;
    }

    const { data: maxSeqData } = await supabase
        .from('reports')
        .select('sequence_number')
        .eq('status', 'submitted')
        .order('sequence_number', { ascending: false })
        .limit(1);
    
    const maxSeq = maxSeqData && maxSeqData.length > 0 ? maxSeqData[0].sequence_number : 0;

    const newId = generateId();
    const newReport: Report = {
        ...report,
        id: newId,
        status: 'submitted',
        sequenceNumber: maxSeq + 1,
        isViewedByManager: false,
        isCommentReadByEmployee: false
    };

    const dbReport = {
        id: newReport.id,
        user_id: newReport.userId,
        sequence_number: newReport.sequenceNumber,
        date: newReport.date,
        day: newReport.day,
        tasks: newReport.tasks,
        accomplished: newReport.accomplished,
        not_accomplished: newReport.notAccomplished,
        attachments: newReport.attachments,
        is_viewed_by_manager: false,
        is_comment_read_by_employee: false,
        status: 'submitted'
    };

    const { error } = await supabase.from('reports').insert(dbReport);
    if (error) throw error;

    return newReport;
};

export const updateReport = async (updatedReport: Report): Promise<Report> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.reports = state.reports.map(r => r.id === updatedReport.id ? updatedReport : r);
        saveToLocalStorage({ ...state, isCloud: false });
        return updatedReport;
    }

    const dbReport = {
        tasks: updatedReport.tasks,
        accomplished: updatedReport.accomplished,
        not_accomplished: updatedReport.notAccomplished,
        attachments: updatedReport.attachments,
        manager_comment: updatedReport.managerComment,
        rating: updatedReport.rating,
        status: updatedReport.status,
        is_viewed_by_manager: updatedReport.isViewedByManager,
        is_comment_read_by_employee: updatedReport.isCommentReadByEmployee
    };

    const { error } = await supabase.from('reports').update(dbReport).eq('id', updatedReport.id);
    if (error) throw error;

    return updatedReport;
};

export const saveOrUpdateDraft = async (draft: Partial<Report>): Promise<Report> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        let newDraft: Report;
        if (draft.id) {
            newDraft = { ...state.reports.find(r => r.id === draft.id)!, ...draft } as Report;
            state.reports = state.reports.map(r => r.id === draft.id ? newDraft : r);
        } else {
            newDraft = { ...draft, id: generateId(), status: 'draft' } as Report;
            state.reports.push(newDraft);
        }
        saveToLocalStorage({ ...state, isCloud: false });
        return newDraft;
    }

    if (draft.id) {
        // Update existing draft
        const dbDraft = {
            tasks: draft.tasks,
            accomplished: draft.accomplished,
            not_accomplished: draft.notAccomplished,
            attachments: draft.attachments,
            date: draft.date,
            day: draft.day
        };
        const { error } = await supabase.from('reports').update(dbDraft).eq('id', draft.id);
        if (error) throw error;
        return draft as Report;
    } else {
        // New draft
        const newId = generateId();
        const newDraft: Report = {
            ...(draft as Report),
            id: newId,
            status: 'draft',
            // Ensure properties exist
            tasks: draft.tasks || [],
            attachments: draft.attachments || [],
            userId: draft.userId!,
            date: draft.date!,
            day: draft.day!,
            accomplished: draft.accomplished || '',
            notAccomplished: draft.notAccomplished || ''
        };

        const dbDraft = {
            id: newId,
            user_id: newDraft.userId,
            date: newDraft.date,
            day: newDraft.day,
            tasks: newDraft.tasks,
            accomplished: newDraft.accomplished,
            not_accomplished: newDraft.notAccomplished,
            attachments: newDraft.attachments,
            status: 'draft',
            is_viewed_by_manager: false,
            is_comment_read_by_employee: false
        };

        const { error } = await supabase.from('reports').insert(dbDraft);
        if (error) throw error;
        return newDraft;
    }
};

export const deleteReport = async (reportId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.reports = state.reports.filter(r => r.id !== reportId);
        saveToLocalStorage({ ...state, isCloud: false });
        return;
    }

    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) throw error;
};

export const markReportAsViewed = async (reportId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        const report = state.reports.find(r => r.id === reportId);
        if (report) {
            report.isViewedByManager = true;
            saveToLocalStorage({ ...state, isCloud: false });
        }
        return;
    }
    const { error } = await supabase.from('reports').update({ is_viewed_by_manager: true }).eq('id', reportId);
    if (error) throw error;
};

export const markCommentAsRead = async (reportId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        const report = state.reports.find(r => r.id === reportId);
        if (report) {
            report.isCommentReadByEmployee = true;
            saveToLocalStorage({ ...state, isCloud: false });
        }
        return;
    }
    const { error } = await supabase.from('reports').update({ is_comment_read_by_employee: true }).eq('id', reportId);
    if (error) throw error;
};

// --- USERS ---

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const newId = generateId();
    const newUser: User = { ...user, id: newId };
    
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.users.push(newUser);
        saveToLocalStorage({ ...state, isCloud: false });
        return newUser;
    }

    const dbUser = {
        id: newId,
        full_name: user.fullName,
        badge_number: user.badgeNumber,
        username: user.username,
        password: user.password,
        role: user.role,
        job_title: user.jobTitle,
        unit: user.unit,
        profile_picture_url: user.profilePictureUrl
    };

    const { error } = await supabase.from('users').insert(dbUser);
    if (error) throw error;

    return newUser;
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.users = state.users.map(u => u.id === updatedUser.id ? updatedUser : u);
        saveToLocalStorage({ ...state, isCloud: false });
        return updatedUser;
    }

    const dbUser = {
        full_name: updatedUser.fullName,
        badge_number: updatedUser.badgeNumber,
        username: updatedUser.username,
        password: updatedUser.password,
        role: updatedUser.role,
        job_title: updatedUser.jobTitle,
        unit: updatedUser.unit,
        profile_picture_url: updatedUser.profilePictureUrl
    };

    const { error } = await supabase.from('users').update(dbUser).eq('id', updatedUser.id);
    if (error) throw error;

    return updatedUser;
};

export const deleteUser = async (userId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.users = state.users.filter(u => u.id !== userId);
        state.reports = state.reports.filter(r => r.userId !== userId); // Cascade delete reports
        saveToLocalStorage({ ...state, isCloud: false });
        return;
    }

    // Cascade delete in Supabase should be handled by DB, but safe to delete reports first
    await supabase.from('reports').delete().eq('user_id', userId);
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
};

// --- ANNOUNCEMENTS ---

export const createAnnouncement = async (content: string): Promise<Announcement> => {
    const newId = generateId();
    const newAnnouncement: Announcement = {
        id: newId,
        content,
        date: new Date().toISOString(),
        readBy: []
    };

    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.announcements.unshift(newAnnouncement);
        saveToLocalStorage({ ...state, isCloud: false });
        return newAnnouncement;
    }

    const dbAnn = {
        id: newId,
        content,
        date: newAnnouncement.date,
        read_by: []
    };

    const { error } = await supabase.from('announcements').insert(dbAnn);
    if (error) throw error;

    return newAnnouncement;
};

export const updateAnnouncement = async (announcementId: string, content: string): Promise<Announcement> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        const ann = state.announcements.find(a => a.id === announcementId);
        if (ann) {
            ann.content = content;
            saveToLocalStorage({ ...state, isCloud: false });
            return ann;
        }
        throw new Error('Announcement not found');
    }

    const { error } = await supabase.from('announcements').update({ content }).eq('id', announcementId);
    if (error) throw error;
    return { id: announcementId, content } as Announcement;
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.announcements = state.announcements.filter(a => a.id !== announcementId);
        saveToLocalStorage({ ...state, isCloud: false });
        return;
    }

    const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
    if (error) throw error;
};

export const markAnnouncementAsRead = async (announcementId: string, userId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        const ann = state.announcements.find(a => a.id === announcementId);
        if (ann && !ann.readBy.some(r => r.userId === userId)) {
            ann.readBy.push({ userId, readAt: new Date().toISOString() });
            saveToLocalStorage({ ...state, isCloud: false });
        }
        return;
    }

    const { data } = await supabase.from('announcements').select('read_by').eq('id', announcementId).single();
    if (data) {
        const currentReadBy = data.read_by || [];
        if (!currentReadBy.some((r: any) => r.userId === userId)) {
            const updatedReadBy = [...currentReadBy, { userId, readAt: new Date().toISOString() }];
            const { error } = await supabase.from('announcements').update({ read_by: updatedReadBy }).eq('id', announcementId);
            if (error) throw error;
        }
    }
};

// --- DIRECT TASKS ---

export const createDirectTask = async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>): Promise<DirectTask> => {
    const newId = generateId();
    const newTask: DirectTask = {
        ...task,
        id: newId,
        sentAt: new Date().toISOString(),
        status: 'pending',
        isReadByEmployee: false
    };

    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        state.directTasks.push(newTask);
        saveToLocalStorage({ ...state, isCloud: false });
        return newTask;
    }

    const dbTask = {
        id: newId,
        manager_id: newTask.managerId,
        employee_id: newTask.employeeId,
        content: newTask.content,
        sent_at: newTask.sentAt,
        status: 'pending',
        is_read_by_employee: false
    };

    const { error } = await supabase.from('direct_tasks').insert(dbTask);
    if (error) throw error;

    return newTask;
};

export const updateDirectTaskStatus = async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        const task = state.directTasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            if (rejectionReason) task.rejectionReason = rejectionReason;
            if (status === 'acknowledged') task.acknowledgedAt = new Date().toISOString();
            saveToLocalStorage({ ...state, isCloud: false });
        }
        return;
    }

    const updates: any = { status };
    if (rejectionReason) updates.rejection_reason = rejectionReason;
    if (status === 'acknowledged') updates.acknowledged_at = new Date().toISOString();
    
    const { error } = await supabase.from('direct_tasks').update(updates).eq('id', taskId);
    if (error) throw error;
};

export const markDirectTaskAsRead = async (taskId: string): Promise<void> => {
    if (!isSupabaseConfigured()) {
        const state = loadFromLocalStorage();
        const task = state.directTasks.find(t => t.id === taskId);
        if (task) {
            task.isReadByEmployee = true;
            saveToLocalStorage({ ...state, isCloud: false });
        }
        return;
    }
    const { error } = await supabase.from('direct_tasks').update({ is_read_by_employee: true }).eq('id', taskId);
    if (error) throw error;
};
