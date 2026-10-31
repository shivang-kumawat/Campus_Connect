import { DELAY_THRESHOLD_HOURS, type ComplaintStatus } from '@/config/complaints';
import type { Complaint } from '@/types/complaint';

export function isComplaintDelayed(complaint: Pick<Complaint, 'status' | 'created_at'>, now = Date.now()) {
  if (complaint.status === 'resolved') return false;
  const ageMs = now - new Date(complaint.created_at).getTime();
  return ageMs > DELAY_THRESHOLD_HOURS * 60 * 60 * 1000;
}

export function formatComplaintDate(value: string) {
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function complaintLocation(complaint: Pick<Complaint, 'hostel' | 'mess'>) {
  return complaint.mess ?? complaint.hostel ?? 'Not set';
}

export function countByStatus(complaints: Pick<Complaint, 'status'>[], status: ComplaintStatus) {
  return complaints.filter((complaint) => complaint.status === status).length;
}
