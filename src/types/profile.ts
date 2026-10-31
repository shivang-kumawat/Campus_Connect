import type { Hostel, Mess, Role } from '@/config/campus';

export type VerificationStatus = 'not_required' | 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  hostel: Hostel | null;
  mess: Mess | null;
  verification_status: VerificationStatus;
  verification_remark: string | null;
  verified_by: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type StudentVerificationRecord = Pick<
  Profile,
  | 'id'
  | 'full_name'
  | 'email'
  | 'hostel'
  | 'mess'
  | 'verification_status'
  | 'verification_remark'
  | 'verified_at'
  | 'created_at'
>;

export interface AllowedEmailDomain {
  domain: string;
  label: string;
  is_demo: boolean;
}
