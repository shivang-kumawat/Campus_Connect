import type { Role } from '@/config/campus';

export const COMPLAINT_CATEGORIES = ['hostel_issue', 'hostel_internet', 'mess_issue'] as const;
export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

export const CATEGORY_LABELS: Record<ComplaintCategory, string> = {
  hostel_issue: 'Hostel Issues',
  hostel_internet: 'Hostel Internet',
  mess_issue: 'Mess Issues',
};

export const ISSUE_TYPES: Record<ComplaintCategory, readonly string[]> = {
  hostel_issue: ['Electricity', 'Water', 'Cleaning', 'AC', 'Fans', 'Maintenance'],
  hostel_internet: ['Wi-Fi', 'Slow internet', 'Connectivity'],
  mess_issue: ['Food quality', 'Hygiene', 'Cleanliness', 'Drinking water'],
};

export const COMPLAINT_STATUSES = ['pending', 'in_progress', 'resolved'] as const;
export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  resolved: 'Resolved',
};

export const DELAY_THRESHOLD_HOURS = 48;

export const COMPLAINT_DESCRIPTION_LIMITS = { min: 10, max: 1000 } as const;
export const REMARK_MAX_LENGTH = 500;
export const COMPLAINT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const COMPLAINT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const ROLE_COMPLAINT_CATEGORIES: Record<Role, readonly ComplaintCategory[]> = {
  student: [],
  hostel_warden: ['hostel_issue'],
  chief_warden: ['hostel_issue', 'mess_issue'],
  it_department: ['hostel_internet'],
  cosha: ['mess_issue'],
  mess_warden: ['mess_issue'],
  assistant_registrar: [],
};
