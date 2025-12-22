
import { User, Report, Announcement, DirectTask, Role } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseConfig';

interface AppState {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    directTasks: DirectTask[];
    isCloud: boolean;
}

const INITIAL_USERS: User[] = [
    { id: 'u1', fullName: 'وسام عبد السلام جلوب', badgeNumber: '12637', username: 'wissam', password: '123', role: Role.MANAGER, jobTitle: 'مسؤول شعبة', unit: 'الإدارة' },
    { id: 'u2', fullName: 'علي حسين عبيد', badgeNumber: '134', username: 'ali134', password: '123', role: Role.EMPLOYEE, jobTitle: 'مسؤول وحدة', unit: 'وحدة التمكين الفني' },
    { id: 'u3', fullName: 'سلام محمد عبد الرسول', badgeNumber: '13385', username: 'salam', password: '123', role: Role.EMPLOYEE, jobTitle: 'مسؤول وحدة', unit: 'وحدة التنسيق الفني' },
];

const generateId = () => crypto.randomUUID();

export const mapUser = (row: any): User => ({
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

export const mapReport = (row: any): Report => ({
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

export const mapAnnouncement = (row: any): Announcement => ({
    id: row.id,
    content: row.content,
    date: row.date,
    readBy: row.read_by || []
});

export const mapDirectTask = (row: any): DirectTask => ({
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

export const fetchInitialData = async (): Promise<AppState> => {
    if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
    try {
        const [usersRes, reportsRes, annRes, tasksRes] = await Promise.all([
            supabase.from('users').select('*'),
            supabase.from('reports').select('*'),
            supabase.from('announcements').select('*'),
            supabase.from('direct_tasks').select('*')
        ]);

        if (usersRes.error) throw usersRes.error;
        let users: User[] = usersRes.data.map(mapUser);

        if (users.length === 0) {
            const dbUsers = INITIAL_USERS.map(u => ({
                id: u.id, full_name: u.fullName, badge_number: u.badgeNumber, username: u.username,
                password: u.password, role: u.role, job_title: u.jobTitle, unit: u.unit
            }));
            await supabase.from('users').insert(dbUsers);
            users = INITIAL_USERS;
        }

        return {
            users,
            reports: (reportsRes.data || []).map(mapReport),
            announcements: (annRes.data || []).map(mapAnnouncement),
            directTasks: (tasksRes.data || []).map(mapDirectTask),
            isCloud: true
        };
    } catch (error: any) {
        throw error;
    }
};

export const subscribeToAllChanges = (onUpdate: (payload: any) => void) => {
    const channel = supabase
        .channel('realtime-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (p) => onUpdate({ table: 'reports', ...p }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_tasks' }, (p) => onUpdate({ table: 'direct_tasks', ...p }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (p) => onUpdate({ table: 'announcements', ...p }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (p) => onUpdate({ table: 'users', ...p }))
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const createReport = async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>): Promise<Report> => {
    const { data: maxSeqData } = await supabase.from('reports').select('sequence_number').eq('status', 'submitted').order('sequence_number', { ascending: false }).limit(1);
    const maxSeq = maxSeqData && maxSeqData.length > 0 ? maxSeqData[0].sequence_number : 0;
    const newId = generateId();
    const dbReport = {
        id: newId, user_id: report.userId, sequence_number: maxSeq + 1, date: report.date, day: report.day,
        tasks: report.tasks, accomplished: report.accomplished, not_accomplished: report.notAccomplished,
        attachments: report.attachments, is_viewed_by_manager: false, is_comment_read_by_employee: false, status: 'submitted'
    };
    const { error } = await supabase.from('reports').insert(dbReport);
    if (error) throw error;
    return { ...report, id: newId, status: 'submitted', sequenceNumber: maxSeq + 1 } as Report;
};

export const updateReport = async (updatedReport: Report): Promise<Report> => {
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
    const dbPayload = {
        user_id: draft.userId,
        date: draft.date,
        day: draft.day,
        tasks: draft.tasks || [],
        accomplished: draft.accomplished || '',
        not_accomplished: draft.notAccomplished || '',
        attachments: draft.attachments || [],
        status: 'draft',
        is_viewed_by_manager: false,
        is_comment_read_by_employee: false,
        sequence_number: null // المسودة لا تملك رقم تسلسل
    };

    if (draft.id) {
        const { error } = await supabase.from('reports').update(dbPayload).eq('id', draft.id);
        if (error) throw error;
        return { ...draft, status: 'draft' } as Report;
    } else {
        const newId = generateId();
        const { error } = await supabase.from('reports').insert({ id: newId, ...dbPayload });
        if (error) throw error;
        return { ...draft, id: newId, status: 'draft' } as Report;
    }
};

export const deleteReport = async (reportId: string): Promise<void> => {
    const { error } = await supabase.from('reports').delete().eq('id', reportId);
    if (error) throw error;
};

export const markReportAsViewed = async (reportId: string): Promise<void> => {
    const { error } = await supabase.from('reports').update({ is_viewed_by_manager: true }).eq('id', reportId);
    if (error) throw error;
};

export const markCommentAsRead = async (reportId: string): Promise<void> => {
    const { error } = await supabase.from('reports').update({ is_comment_read_by_employee: true }).eq('id', reportId);
    if (error) throw error;
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const newId = generateId();
    const dbUser = { id: newId, full_name: user.fullName, badge_number: user.badgeNumber, username: user.username, password: user.password, role: user.role, job_title: user.jobTitle, unit: user.unit, profile_picture_url: user.profilePictureUrl };
    const { error } = await supabase.from('users').insert(dbUser);
    if (error) throw error;
    return { ...user, id: newId };
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    const dbUser = { full_name: updatedUser.fullName, badge_number: updatedUser.badgeNumber, username: updatedUser.username, password: updatedUser.password, role: updatedUser.role, job_title: updatedUser.jobTitle, unit: updatedUser.unit, profile_picture_url: updatedUser.profilePictureUrl };
    const { error } = await supabase.from('users').update(dbUser).eq('id', updatedUser.id);
    if (error) throw error;
    return updatedUser;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await supabase.from('reports').delete().eq('user_id', userId);
    const { error } = await supabase.from('users').delete().eq('id', userId);
    if (error) throw error;
};

export const createAnnouncement = async (content: string): Promise<Announcement> => {
    const newId = generateId();
    const dbAnn = { id: newId, content, date: new Date().toISOString(), read_by: [] };
    const { error } = await supabase.from('announcements').insert(dbAnn);
    if (error) throw error;
    return { id: newId, content, date: dbAnn.date, readBy: [] };
};

export const updateAnnouncement = async (announcementId: string, content: string): Promise<Announcement> => {
    const { error } = await supabase.from('announcements').update({ content }).eq('id', announcementId);
    if (error) throw error;
    return { id: announcementId, content } as Announcement;
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    const { error } = await supabase.from('announcements').delete().eq('id', announcementId);
    if (error) throw error;
};

export const markAnnouncementAsRead = async (announcementId: string, userId: string): Promise<void> => {
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

export const createDirectTask = async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>): Promise<DirectTask> => {
    const newId = generateId();
    const dbTask = { id: newId, manager_id: task.managerId, employee_id: task.employeeId, content: task.content, sent_at: new Date().toISOString(), status: 'pending', is_read_by_employee: false };
    const { error } = await supabase.from('direct_tasks').insert(dbTask);
    if (error) throw error;
    return { ...task, id: newId, sentAt: dbTask.sent_at, status: 'pending', isReadByEmployee: false };
};

export const updateDirectTaskStatus = async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string): Promise<void> => {
    const updates: any = { status };
    if (rejectionReason) updates.rejection_reason = rejectionReason;
    if (status === 'acknowledged') updates.acknowledged_at = new Date().toISOString();
    const { error } = await supabase.from('direct_tasks').update(updates).eq('id', taskId);
    if (error) throw error;
};

export const markDirectTaskAsRead = async (taskId: string): Promise<void> => {
    const { error } = await supabase.from('direct_tasks').update({ is_read_by_employee: true }).eq('id', taskId);
    if (error) throw error;
};
