export enum Role {
    EMPLOYEE = 'employee',
    MANAGER = 'manager',
}

export interface User {
    id: string;
    fullName: string;
    badgeNumber: string;
    phone: string;
    role: Role;
    password?: string;
    jobTitle: string; // Add job title
    profilePictureUrl?: string;
    signatureImageUrl?: string;
}

export interface Attachment {
    name: string;
    type: string;
    size: number;
    content: string; // To store base64 data URL of the file
}

export interface Task {
    id: string;
    text: string;
    isDeleted?: boolean;
    managerComment?: string;
}

export interface Report {
    id: string;
    userId: string;
    sequenceNumber: number;
    date: string;
    day: string;
    tasks: Task[];
    accomplished: string;
    notAccomplished: string;
    attachments: Attachment[];
    managerComment?: string;
    signatureTimestamp?: string;
    signatureImage?: string; // To store the base64 image of the signature
    isViewedByManager?: boolean;
    isCommentReadByEmployee?: boolean;
    rating?: number;
}

export interface ReadEntry {
    userId: string;
    readAt: string;
}

export interface Announcement {
    id: string;
    content: string;
    date: string;
    readBy: ReadEntry[]; // Array of ReadEntry objects
}