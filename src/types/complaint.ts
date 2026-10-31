import type { Hostel, Mess, Role } from '@/config/campus';
import type { ComplaintCategory, ComplaintStatus } from '@/config/complaints';

export interface Complaint {
  id: string;
  student_id: string;
  student_name: string;
  category: ComplaintCategory;
  issue_type: string;
  description: string;
  hostel: Hostel | null;
  mess: Mess | null;
  image_path: string | null;
  status: ComplaintStatus;
  last_reminded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ComplaintUpdate {
  id: string;
  complaint_id: string;
  actor_role: Role | null;
  kind: 'created' | 'status' | 'reminder';
  status: ComplaintStatus | null;
  remark: string | null;
  created_at: string;
}
