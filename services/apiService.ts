
import { User, Report, Announcement, DirectTask, Role } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseConfig';

interface AppState {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    directTasks: DirectTask[];
    isCloud: boolean;
}

const generateId = () => crypto.randomUUID();

export const mapUser = (row: any): User => ({
    id: row.id,
    fullName: row.full_name,
    // Removed redundant and incorrect badge_number property to match User interface
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

/**
 * تحسين: جلب البيانات الأساسية فقط بدون المرفقات (Base64) لتسريع التحميل
 */
export const fetchInitialData = async (): Promise<AppState> => {
    if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
    
    const [usersRes, reportsRes, annRes, tasksRes] = await Promise.all([
        supabase.from('users').select('*'),
        // جلب آخر 50 تقرير فقط واستثناء عمود المرفقات الثقيل
        supabase.from('reports')
            .select('id, user_id, sequence_number, date, day, status, manager_comment, is_viewed_by_manager, is_comment_read_by_employee, rating, accomplished, not_accomplished, tasks')
            .order('date', { ascending: false })
            .limit(50),
        supabase.from('announcements').select('*'),
        supabase.from('direct_tasks').select('*')
    ]);

    return {
        users: (usersRes.data || []).map(mapUser),
        reports: (reportsRes.data || []).map(mapReport),
        announcements: (annRes.data || []).map(mapAnnouncement),
        directTasks: (tasksRes.data || []).map(mapDirectTask),
        isCloud: true
    };
};

/**
 * دالة جديدة لجلب المرفقات فقط عند الحاجة (فتح تقرير معين)
 */
export const fetchReportAttachments = async (reportId: string): Promise<any[]> => {
    const { data, error } = await supabase
        .from('reports')
        .select('attachments')
        .eq('id', reportId)
        .single();
    
    if (error) throw error;
    return data?.attachments || [];
};

export const subscribeToAllChanges = (onUpdate: (payload: any) => void) => {
    const channel = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, (p) => onUpdate({ table: 'reports', ...p }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'direct_tasks' }, (p) => onUpdate({ table: 'direct_tasks', ...p }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'announcements' }, (p) => onUpdate({ table: 'announcements', ...p }))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, (p) => onUpdate({ table: 'users', ...p }))
        .subscribe();

    return () => { supabase.removeChannel(channel); };
};

export const subscribeToBroadcast = (eventName: string, callback: (payload: any) => void) => {
    const channel = supabase.channel('room-1')
        .on('broadcast', { event: eventName }, (payload) => callback(payload))
        .subscribe();
    return channel;
};

export const sendBroadcast = (channel: any, eventName: string, payload: any) => {
    channel.send({
        type: 'broadcast',
        event: eventName,
        payload
    });
};

export const createReport = async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>): Promise<Report> => {
    const { data: maxSeqData } = await supabase
        .from('reports')
        .select('sequence_number')
        .eq('user_id', report.userId)
        .eq('status', 'submitted')
        .order('sequence_number', { ascending: false })
        .limit(1);

    const maxSeq = maxSeqData && maxSeqData.length > 0 ? maxSeqData[0].sequence_number : 0;
    const newId = generateId();
    const dbReport = {
        id: newId, 
        user_id: report.userId, 
        sequence_number: maxSeq + 1, 
        date: report.date, 
        day: report.day,
        tasks: report.tasks, 
        accomplished: report.accomplished, 
        not_accomplished: report.notAccomplished,
        attachments: report.attachments, 
        status: 'submitted', 
        is_viewed_by_manager: false, 
        is_comment_read_by_employee: false
    };
    const { error } = await supabase.from('reports').insert(dbReport);
    if (error) throw error;
    return { ...report, id: newId, status: 'submitted', sequenceNumber: maxSeq + 1 } as Report;
};

export const saveOrUpdateDraft = async (draft: Partial<Report>): Promise<Report> => {
    const dbPayload = {
        user_id: draft.userId, date: draft.date, day: draft.day, tasks: draft.tasks || [],
        accomplished: draft.accomplished || '', not_accomplished: draft.notAccomplished || '',
        attachments: draft.attachments || [], status: 'draft', sequence_number: null
    };

    if (draft.id && !draft.id.startsWith('temp-')) {
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

export const updateReport = async (updatedReport: Report): Promise<Report> => {
    const { error } = await supabase.from('reports').update({
        tasks: updatedReport.tasks, accomplished: updatedReport.accomplished,
        not_accomplished: updatedReport.notAccomplished, attachments: updatedReport.attachments,
        manager_comment: updatedReport.managerComment, rating: updatedReport.rating,
        status: updatedReport.status, is_viewed_by_manager: updatedReport.isViewedByManager,
        is_comment_read_by_employee: updatedReport.isCommentReadByEmployee
    }).eq('id', updatedReport.id);
    if (error) throw error;
    return updatedReport;
};

export const deleteReport = async (reportId: string): Promise<void> => {
    await supabase.from('reports').delete().eq('id', reportId);
};

export const markReportAsViewed = async (reportId: string): Promise<void> => {
    await supabase.from('reports').update({ is_viewed_by_manager: true }).eq('id', reportId);
};

export const markAllReportsAsReadForUser = async (userId: string): Promise<void> => {
    await supabase.from('reports').update({ is_viewed_by_manager: true }).eq('user_id', userId).eq('status', 'submitted');
};

export const markCommentAsRead = async (reportId: string): Promise<void> => {
    await supabase.from('reports').update({ is_comment_read_by_employee: true }).eq('id', reportId);
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
    await supabase.from('direct_tasks').update(updates).eq('id', taskId);
};

export const markDirectTaskAsRead = async (taskId: string): Promise<void> => {
    await supabase.from('direct_tasks').update({ is_read_by_employee: true }).eq('id', taskId);
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const newId = generateId();
    await supabase.from('users').insert({ id: newId, full_name: user.fullName, badge_number: user.badgeNumber, username: user.username, password: user.password, role: user.role, job_title: user.jobTitle, unit: user.unit, profile_picture_url: user.profilePictureUrl });
    return { ...user, id: newId };
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    await supabase.from('users').update({ full_name: updatedUser.fullName, badge_number: updatedUser.badgeNumber, username: updatedUser.username, password: updatedUser.password, role: updatedUser.role, job_title: updatedUser.jobTitle, unit: updatedUser.unit, profile_picture_url: updatedUser.profilePictureUrl }).eq('id', updatedUser.id);
    return updatedUser;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await supabase.from('reports').delete().eq('user_id', userId);
    await supabase.from('users').delete().eq('id', userId);
};

export const createAnnouncement = async (content: string): Promise<Announcement> => {
    const newId = generateId();
    const { error } = await supabase.from('announcements').insert({ id: newId, content, date: new Date().toISOString(), read_by: [] });
    if (error) throw error;
    return { id: newId, content, date: new Date().toISOString(), readBy: [] };
};

export const updateAnnouncement = async (announcementId: string, content: string): Promise<Announcement> => {
    await supabase.from('announcements').update({ content }).eq('id', announcementId);
    return { id: announcementId, content } as Announcement;
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    await supabase.from('announcements').delete().eq('id', announcementId);
};

export const markAnnouncementAsRead = async (announcementId: string, userId: string): Promise<void> => {
    const { data } = await supabase.from('announcements').select('read_by').eq('id', announcementId).single();
    if (data) {
        const currentReadBy = data.read_by || [];
        if (!currentReadBy.some((r: any) => r.userId === userId)) {
            const updatedReadBy = [...currentReadBy, { userId, readAt: new Date().toISOString() }];
            await supabase.from('announcements').update({ read_by: updatedReadBy }).eq('id', announcementId);
        }
    }
};
