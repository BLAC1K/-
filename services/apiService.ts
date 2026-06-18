
import { User, Report, Announcement, DirectTask, Role, ArtPost } from '../types';
import { supabase, isSupabaseConfigured } from './supabaseConfig';
import { db } from './firebaseConfig';
import { 
    collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, 
    query, where, onSnapshot, orderBy, limit 
} from 'firebase/firestore';

interface AppState {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    directTasks: DirectTask[];
    artPosts: ArtPost[];
    isCloud: boolean;
}

const generateId = () => crypto.randomUUID();

export const mapArtComment = (row: any) => ({
    id: row.id,
    userId: row.user_id || row.userId,
    content: row.content,
    createdAt: row.created_at || row.createdAt
});

export const mapArtPost = (row: any): ArtPost => ({
    id: row.id,
    title: row.title,
    description: row.description,
    details: row.details,
    organizer: row.organizer,
    date: row.date,
    createdAt: row.created_at || row.createdAt,
    images: row.images || [],
    collaborators: row.collaborators,
    participantCount: row.participant_count || row.participantCount,
    category: row.category,
    tags: row.tags || [],
    likes: row.likes || [],
    comments: (row.comments || []).map(mapArtComment)
});

export const mapUser = (row: any): User => ({
    id: row.id,
    fullName: row.full_name || row.fullName,
    badgeNumber: row.badge_number || row.badgeNumber,
    username: row.username,
    password: row.password,
    role: row.role as Role,
    jobTitle: row.job_title || row.jobTitle,
    unit: row.unit,
    profilePictureUrl: row.profile_picture_url || row.profilePictureUrl
});

export const mapReport = (row: any): Report => ({
    id: row.id,
    userId: row.user_id || row.userId,
    sequenceNumber: row.sequence_number || row.sequenceNumber,
    date: row.date,
    day: row.day,
    tasks: row.tasks || [],
    accomplished: row.accomplished,
    notAccomplished: row.not_accomplished || row.notAccomplished,
    attachments: row.attachments || [],
    managerComment: row.manager_comment || row.managerComment,
    isViewedByManager: row.is_viewed_by_manager || row.isViewedByManager,
    isCommentReadByEmployee: row.is_comment_read_by_employee || row.isCommentReadByEmployee,
    rating: row.rating,
    status: row.status || 'submitted'
});

export const mapAnnouncement = (row: any): Announcement => ({
    id: row.id,
    content: row.content,
    date: row.date,
    readBy: row.read_by || row.readBy || []
});

export const mapDirectTask = (row: any): DirectTask => ({
    id: row.id,
    managerId: row.manager_id || row.managerId,
    employeeId: row.employee_id || row.employeeId,
    content: row.content,
    sentAt: row.sent_at || row.sentAt,
    status: row.status,
    acknowledgedAt: row.acknowledged_at || row.acknowledgedAt,
    rejectionReason: row.rejection_reason || row.rejectionReason,
    isReadByEmployee: row.is_read_by_employee || row.isReadByEmployee
});

// Migration helper: sync Supabase to Firebase once
export const fetchReportById = async (id: string): Promise<Report | null> => {
    const d = await getDoc(doc(db, 'reports', id));
    return d.exists() ? d.data() as Report : null;
};

export const fetchDirectTaskById = async (id: string): Promise<DirectTask | null> => {
    const d = await getDoc(doc(db, 'direct_tasks', id));
    return d.exists() ? d.data() as DirectTask : null;
};

export const fetchAnnouncementById = async (id: string): Promise<Announcement | null> => {
    const d = await getDoc(doc(db, 'announcements', id));
    return d.exists() ? d.data() as Announcement : null;
};

export const fetchInitialData = async (): Promise<AppState> => {
    try {
        const fetchPromise = Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'reports')),
            getDocs(collection(db, 'announcements')),
            getDocs(collection(db, 'direct_tasks')),
            getDocs(collection(db, 'art_posts'))
        ]);
        
        // 15 seconds timeout
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout: Connection is taking too long.')), 15000)
        );

        const [uSnap, rSnap, aSnap, tSnap, apSnap] = await Promise.race([
            fetchPromise,
            timeoutPromise
        ]) as any[];

        return {
            users: uSnap.docs.map((d: any) => d.data() as User),
            reports: rSnap.docs.map((d: any) => d.data() as Report).filter((r: any) => r && r.date).sort((a: any, b: any)=> new Date(b.date).getTime() - new Date(a.date).getTime()),
            announcements: aSnap.docs.map((d: any) => d.data() as Announcement).filter((a: any) => a && a.date).sort((a: any, b: any)=> new Date(b.date).getTime() - new Date(a.date).getTime()),
            directTasks: tSnap.docs.map((d: any) => d.data() as DirectTask).filter((t: any) => t && t.sentAt).sort((a: any, b: any)=> new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()),
            artPosts: apSnap.docs.map((d: any) => d.data() as ArtPost).filter((p: any) => p && p.createdAt).sort((a: any, b: any)=> new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
            isCloud: true
        };
    } catch (error: any) {
        console.error('fetchInitialData failed:', error);
        throw error;
    }
};

export const subscribeToAllChanges = (onUpdate: (payload: any) => void) => {
    let isInitialReports = true;
    let isInitialUsers = true;
    let isInitialAnnouncements = true;
    let isInitialTasks = true;
    let isInitialArtPosts = true;

    const handleSnap = (table: string, isInitialFlagObj: { value: boolean }, mapper: any) => (snap: any) => {
        if (isInitialFlagObj.value) {
            isInitialFlagObj.value = false;
            return; // Skip the initial massive 'added' burst because fetchInitialData already gets them
        }
        snap.docChanges().forEach((change: any) => {
            const docData = change.doc.data();
            const mapped = mapper ? mapper(docData) : docData;
            const payload = {
                table,
                eventType: change.type === 'added' ? 'INSERT' : change.type === 'modified' ? 'UPDATE' : 'DELETE',
                new: change.type !== 'removed' ? mapped : null,
                old: change.type === 'removed' ? { id: change.doc.id } : null,
            };
            onUpdate(payload);
        });
    };

    const unsubs = [
        onSnapshot(collection(db, 'reports'), handleSnap('reports', { get value() { return isInitialReports; }, set value(v) { isInitialReports = v; } }, mapReport)),
        onSnapshot(collection(db, 'users'), handleSnap('users', { get value() { return isInitialUsers; }, set value(v) { isInitialUsers = v; } }, mapUser)),
        onSnapshot(collection(db, 'announcements'), handleSnap('announcements', { get value() { return isInitialAnnouncements; }, set value(v) { isInitialAnnouncements = v; } }, mapAnnouncement)),
        onSnapshot(collection(db, 'direct_tasks'), handleSnap('direct_tasks', { get value() { return isInitialTasks; }, set value(v) { isInitialTasks = v; } }, mapDirectTask)),
        onSnapshot(collection(db, 'art_posts'), handleSnap('art_posts', { get value() { return isInitialArtPosts; }, set value(v) { isInitialArtPosts = v; } }, mapArtPost))
    ];
    return () => unsubs.forEach(u => u());
};

export const submitReport = async (reportData: Omit<Report, 'id' | 'sequenceNumber' | 'status'>, draftId?: string): Promise<Report> => {
    const rSnap = await getDocs(query(collection(db, 'reports'), where('userId', '==', reportData.userId), where('status', '==', 'submitted')));
    let maxSeq = 0;
    rSnap.forEach(d => { const s = d.data().sequenceNumber; if (s > maxSeq) maxSeq = s; });

    const submissionData: any = {
        id: draftId || generateId(),
        userId: reportData.userId,
        sequenceNumber: maxSeq + 1,
        date: reportData.date,
        day: reportData.day,
        tasks: reportData.tasks,
        accomplished: reportData.accomplished,
        notAccomplished: reportData.notAccomplished,
        attachments: reportData.attachments,
        status: 'submitted',
        isViewedByManager: false,
        isCommentReadByEmployee: false
    };

    Object.keys(submissionData).forEach(key => submissionData[key] === undefined && delete submissionData[key]);

    await setDoc(doc(db, 'reports', submissionData.id), submissionData);
    return submissionData as Report;
};

export const createReport = submitReport;

export const saveOrUpdateDraft = async (draft: Partial<Report>): Promise<Report> => {
    const rId = draft.id && !draft.id.startsWith('temp-') ? draft.id : generateId();
    const d: any = {
        ...draft, id: rId, status: 'draft', 
        userId: draft.userId!, date: draft.date!, day: draft.day!
    };
    if (d.sequenceNumber === undefined) delete d.sequenceNumber;
    
    // Clean up undefined values to avoid Firestore errors
    Object.keys(d).forEach(key => d[key] === undefined && delete d[key]);

    await setDoc(doc(db, 'reports', rId), d, { merge: true });
    return d as Report;
};

export const updateReport = async (updatedReport: Report): Promise<Report> => {
    await updateDoc(doc(db, 'reports', updatedReport.id), updatedReport as any);
    return updatedReport;
};

export const deleteReport = async (reportId: string): Promise<void> => {
    await deleteDoc(doc(db, 'reports', reportId));
};

export const markReportAsViewed = async (reportId: string): Promise<void> => {
    await updateDoc(doc(db, 'reports', reportId), { isViewedByManager: true });
};

export const markReportAsUnread = async (reportId: string): Promise<void> => {
    await updateDoc(doc(db, 'reports', reportId), { isViewedByManager: false });
};

export const markAllReportsAsReadForUser = async (userId: string): Promise<void> => {
    const q = query(collection(db, 'reports'), where('userId', '==', userId), where('status', '==', 'submitted'));
    const s = await getDocs(q);
    s.forEach(d => updateDoc(d.ref, { isViewedByManager: true }));
};

export const markCommentAsRead = async (reportId: string): Promise<void> => {
    await updateDoc(doc(db, 'reports', reportId), { isCommentReadByEmployee: true });
};

export const createDirectTask = async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>): Promise<DirectTask> => {
    const t: DirectTask = { ...task, id: generateId(), sentAt: new Date().toISOString(), status: 'pending', isReadByEmployee: false };
    await setDoc(doc(db, 'direct_tasks', t.id), t);
    return t;
};

export const updateDirectTaskStatus = async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string): Promise<void> => {
    const p: any = { status };
    if (rejectionReason) p.rejectionReason = rejectionReason;
    if (status === 'acknowledged') p.acknowledgedAt = new Date().toISOString();
    await updateDoc(doc(db, 'direct_tasks', taskId), p);
};

export const markDirectTaskAsRead = async (taskId: string): Promise<void> => {
    await updateDoc(doc(db, 'direct_tasks', taskId), { isReadByEmployee: true });
};

export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    const u: User = { ...user, id: generateId() };
    await setDoc(doc(db, 'users', u.id), u);
    return u;
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    await updateDoc(doc(db, 'users', updatedUser.id), updatedUser as any);
    return updatedUser;
};

export const deleteUser = async (userId: string): Promise<void> => {
    await deleteDoc(doc(db, 'users', userId));
};

export const createAnnouncement = async (content: string): Promise<Announcement> => {
    const a: Announcement = { id: generateId(), content, date: new Date().toISOString(), readBy: [] };
    await setDoc(doc(db, 'announcements', a.id), a);
    return a;
};

export const updateAnnouncement = async (announcementId: string, content: string): Promise<Announcement> => {
    await updateDoc(doc(db, 'announcements', announcementId), { content });
    return { id: announcementId, content } as Announcement;
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    await deleteDoc(doc(db, 'announcements', announcementId));
};

export const markAnnouncementAsRead = async (announcementId: string, userId: string): Promise<void> => {
    const d = await getDoc(doc(db, 'announcements', announcementId));
    if (d.exists()) {
        const a = d.data() as Announcement;
        if (!a.readBy.some(r => r.userId === userId)) {
            a.readBy.push({ userId, readAt: new Date().toISOString() });
            await updateDoc(d.ref, { readBy: a.readBy });
        }
    }
};

export const createArtPost = async (post: Omit<ArtPost, 'id' | 'createdAt' | 'likes' | 'comments'>): Promise<ArtPost> => {
    const p: ArtPost = {
        ...post, id: generateId(), createdAt: new Date().toISOString(),
        likes: [], comments: []
    };
    await setDoc(doc(db, 'art_posts', p.id), p);
    return p;
};

export const updateArtPost = async (updatedPost: ArtPost): Promise<ArtPost> => {
    await updateDoc(doc(db, 'art_posts', updatedPost.id), updatedPost as any);
    return updatedPost;
};

export const deleteArtPost = async (postId: string): Promise<void> => {
    await deleteDoc(doc(db, 'art_posts', postId));
};

export const toggleLikeArtPost = async (postId: string, userId: string, currentLikes: string[]): Promise<string[]> => {
    const newLikes = currentLikes.includes(userId) ? currentLikes.filter(id => id !== userId) : [...currentLikes, userId];
    await updateDoc(doc(db, 'art_posts', postId), { likes: newLikes });
    return newLikes;
};

export const addArtComment = async (postId: string, userId: string, content: string, currentComments: any[]): Promise<any> => {
    const c = { id: generateId(), userId, content, createdAt: new Date().toISOString() };
    const newComments = [...currentComments, c];
    await updateDoc(doc(db, 'art_posts', postId), { comments: newComments });
    return c;
};

export const deleteArtComment = async (postId: string, commentId: string, currentComments: any[]): Promise<any[]> => {
    const newComments = currentComments.filter(c => c.id !== commentId);
    await updateDoc(doc(db, 'art_posts', postId), { comments: newComments });
    return newComments;
};

export const editArtComment = async (postId: string, commentId: string, newContent: string, currentComments: any[]): Promise<any[]> => {
    const newComments = currentComments.map(c => c.id === commentId ? { ...c, content: newContent } : c);
    await updateDoc(doc(db, 'art_posts', postId), { comments: newComments });
    return newComments;
};

