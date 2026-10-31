import { supabase } from '@/lib/supabase';
import type { StudentVerificationRecord } from '@/types/profile';

export type ReviewDecision = 'approved' | 'rejected';

const STUDENT_COLUMNS =
  'id, full_name, email, hostel, mess, verification_status, verification_remark, verified_at, created_at';

export async function fetchHostelStudents(): Promise<StudentVerificationRecord[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(STUDENT_COLUMNS)
    .eq('role', 'student')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as StudentVerificationRecord[];
}

const REVIEW_ERROR_MESSAGES: Record<string, string> = {
  '42501': 'You are not allowed to review students for this hostel.',
  P0002: 'This student has already been reviewed or is no longer waiting for verification.',
  '22023': 'Choose either approve or reject.',
  '22001': 'The remark is too long. Keep it under 500 characters.',
};

export async function reviewStudentHostel(
  studentId: string,
  decision: ReviewDecision,
  remark: string,
): Promise<void> {
  const { error } = await supabase.rpc('review_student_hostel', {
    p_student: studentId,
    p_decision: decision,
    p_remark: remark.trim() === '' ? null : remark.trim(),
  });
  if (error) {
    throw new Error(REVIEW_ERROR_MESSAGES[error.code ?? ''] ?? 'We could not save this decision. Please try again.');
  }
}
