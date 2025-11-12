export enum Role {
    EMPLOYEE = 'employee',
    MANAGER = 'manager',
}

export interface SignaturePoint {
  x: number;
  y: number;
  time: number;
  color: string;
}

export type SignatureData = SignaturePoint[][];

export interface User {
    id: string;
    fullName: string;
    badgeNumber: string;
    username: string;
    role: Role;
    password?: string;
    jobTitle: string; // Add job title
    profilePictureUrl?: string;
    signatureData?: SignatureData;
    signatureImageUrl?: string;
    unit?: string;
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
    sequenceNumber?: number; // Optional for drafts
    date: string;
    day: string;
    tasks: Task[];
    accomplished: string;
    notAccomplished: string;
    attachments: Attachment[];
    managerComment?: string;
    signatureTimestamp?: string;
    signatureData?: SignatureData; // To store the biometric signature data
    signatureImageUrl?: string; // To store the uploaded signature image
    isViewedByManager?: boolean;
    isCommentReadByEmployee?: boolean;
    rating?: number;
    status: 'draft' | 'submitted';
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

export interface DirectTask {
    id: string;
    managerId: string;
    employeeId: string;
    content: string;
    sentAt: string;
    status: 'pending' | 'acknowledged' | 'rejected';
    acknowledgedAt?: string;
    rejectionReason?: string;
    isReadByEmployee: boolean;
}