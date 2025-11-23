import { User, Report, Announcement, DirectTask } from '../types';

// IMPORTANT: This is a placeholder for your actual backend API URL.
// You need to replace this URL with the one for your server.
const API_BASE_URL = 'https://my-daily-tasks-api.example.com/api';

interface AppState {
    users: User[];
    reports: Report[];
    announcements: Announcement[];
    directTasks: DirectTask[];
}

/**
 * A helper function to make API requests and handle common logic.
 * @param endpoint The API endpoint to call (e.g., '/users').
 * @param options The options for the fetch request (method, body, etc.).
 * @returns The JSON response from the API.
 */
const apiRequest = async <T>(endpoint: string, options: RequestInit = {}): Promise<T> => {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred' }));
            console.error(`API Error on ${endpoint}:`, response.status, errorData);
            throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
        
        // Handle responses that might not have a body (e.g., DELETE, or 204 No Content)
        if (response.status === 204) {
            return undefined as T;
        }
        return await response.json();
    } catch (error) {
        console.error(`Network or fetch error on ${endpoint}:`, error);
        // Re-throw the error so the calling component or context can handle it.
        throw error;
    }
};

// --- API Service Functions ---

// In a real-world scenario, you might have separate endpoints for each data type.
// For simplicity in this refactor, we'll assume a single endpoint to get all initial data.
export const fetchInitialData = async (): Promise<AppState> => {
    // This assumes your backend has an endpoint like GET /api/data that returns the entire app state.
    return apiRequest<AppState>('/data');
};

// REPORTS
export const createReport = async (report: Omit<Report, 'id' | 'sequenceNumber' | 'status'>): Promise<Report> => {
    return apiRequest<Report>('/reports', {
        method: 'POST',
        body: JSON.stringify({ ...report, status: 'submitted' }),
    });
};

export const updateReport = async (updatedReport: Report): Promise<Report> => {
    return apiRequest<Report>(`/reports/${updatedReport.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedReport),
    });
};

export const saveOrUpdateDraft = async (draft: Partial<Report>): Promise<Report> => {
    const fullDraft = { ...draft, status: 'draft' };
    if (draft.id) {
        // Update existing draft
        return apiRequest<Report>(`/reports/${draft.id}`, {
            method: 'PUT',
            body: JSON.stringify(fullDraft),
        });
    } else {
        // Create new draft
        return apiRequest<Report>('/reports', {
            method: 'POST',
            body: JSON.stringify(fullDraft),
        });
    }
};

export const deleteReport = async (reportId: string): Promise<void> => {
    await apiRequest<void>(`/reports/${reportId}`, { method: 'DELETE' });
};

export const markReportAsViewed = async (reportId: string): Promise<void> => {
    // A real API would ideally use PATCH here for efficiency.
    // This endpoint should handle setting `isViewedByManager` to true on the server.
    await apiRequest<void>(`/reports/${reportId}/viewed`, { method: 'POST' });
};

export const markCommentAsRead = async (reportId: string): Promise<void> => {
    // This endpoint should handle setting `isCommentReadByEmployee` to true on the server.
    await apiRequest<void>(`/reports/${reportId}/comment-read`, { method: 'POST' });
};

// USERS
export const createUser = async (user: Omit<User, 'id'>): Promise<User> => {
    return apiRequest<User>('/users', {
        method: 'POST',
        body: JSON.stringify(user),
    });
};

export const updateUser = async (updatedUser: User): Promise<User> => {
    return apiRequest<User>(`/users/${updatedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedUser),
    });
};

export const deleteUser = async (userId: string): Promise<void> => {
    await apiRequest<void>(`/users/${userId}`, { method: 'DELETE' });
};

// ANNOUNCEMENTS
export const createAnnouncement = async (content: string): Promise<Announcement> => {
    return apiRequest<Announcement>('/announcements', {
        method: 'POST',
        body: JSON.stringify({ content }),
    });
};

export const updateAnnouncement = async (announcementId: string, content: string): Promise<Announcement> => {
    return apiRequest<Announcement>(`/announcements/${announcementId}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
    });
};

export const deleteAnnouncement = async (announcementId: string): Promise<void> => {
    await apiRequest<void>(`/announcements/${announcementId}`, { method: 'DELETE' });
};

export const markAnnouncementAsRead = async (announcementId: string, userId: string): Promise<void> => {
    // This endpoint should add the user to the `readBy` list on the server.
    await apiRequest<void>(`/announcements/${announcementId}/read`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });
};

// DIRECT TASKS
export const createDirectTask = async (task: Omit<DirectTask, 'id' | 'sentAt' | 'status' | 'isReadByEmployee'>): Promise<DirectTask> => {
    return apiRequest<DirectTask>('/direct-tasks', {
        method: 'POST',
        body: JSON.stringify(task),
    });
};

export const updateDirectTaskStatus = async (taskId: string, status: 'acknowledged' | 'rejected', rejectionReason?: string): Promise<void> => {
    // This endpoint should update the task's status on the server.
    await apiRequest<void>(`/direct-tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, rejectionReason }),
    });
};

export const markDirectTaskAsRead = async (taskId: string): Promise<void> => {
    // This endpoint should update the task's read status on the server.
    await apiRequest<void>(`/direct-tasks/${taskId}/read`, { method: 'POST' });
};
