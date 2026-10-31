import { supabase } from '@/lib/supabase';
import {
  COMPLAINT_IMAGE_MAX_BYTES,
  COMPLAINT_IMAGE_TYPES,
  type ComplaintCategory,
  type ComplaintStatus,
} from '@/config/complaints';
import type { Complaint, ComplaintUpdate } from '@/types/complaint';

const COMPLAINT_COLUMNS =
  'id, student_id, student_name, category, issue_type, description, hostel, mess, image_path, status, last_reminded_at, resolved_at, created_at, updated_at';
const UPDATE_COLUMNS = 'id, complaint_id, actor_role, kind, status, remark, created_at';
const IMAGE_BUCKET = 'complaint-images';
const SIGNED_URL_SECONDS = 300;

export async function listComplaints(): Promise<Complaint[]> {
  const { data, error } = await supabase
    .from('complaints')
    .select(COMPLAINT_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Complaint[];
}

export async function fetchComplaintUpdates(complaintId: string): Promise<ComplaintUpdate[]> {
  const { data, error } = await supabase
    .from('complaint_updates')
    .select(UPDATE_COLUMNS)
    .eq('complaint_id', complaintId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []) as ComplaintUpdate[];
}

export async function getComplaintImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from(IMAGE_BUCKET).createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) throw new Error('We could not load this photo.');
  return data.signedUrl;
}

export function validateComplaintImage(file: File): string | null {
  if (!(COMPLAINT_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Upload a JPEG, PNG or WebP image.';
  }
  if (file.size > COMPLAINT_IMAGE_MAX_BYTES) {
    return 'Photos must be 5 MB or smaller.';
  }
  return null;
}

const IMAGE_EXTENSIONS: Record<(typeof COMPLAINT_IMAGE_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface NewComplaintInput {
  studentId: string;
  category: ComplaintCategory;
  issueType: string;
  description: string;
  image: File | null;
}

export async function createComplaint(input: NewComplaintInput): Promise<void> {
  const complaintId = crypto.randomUUID();
  let imagePath: string | null = null;

  if (input.image) {
    const extension = IMAGE_EXTENSIONS[input.image.type as (typeof COMPLAINT_IMAGE_TYPES)[number]];
    imagePath = `${input.studentId}/${complaintId}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(imagePath, input.image, { contentType: input.image.type, upsert: false });
    if (uploadError) throw new Error('We could not upload the photo. Please try again.');
  }

  const { error } = await supabase.from('complaints').insert({
    id: complaintId,
    category: input.category,
    issue_type: input.issueType,
    description: input.description.trim(),
    image_path: imagePath,
  });

  if (error) {
    if (imagePath) await supabase.storage.from(IMAGE_BUCKET).remove([imagePath]);
    throw new Error('We could not submit your complaint. Check the details and try again.');
  }
}

const STATUS_ERROR_MESSAGES: Record<string, string> = {
  '42501': 'You are not allowed to update this complaint.',
  P0002: 'This complaint could not be found.',
  '22023': 'Choose a different status or add a remark.',
  '22001': 'The remark is too long. Keep it under 500 characters.',
};

const REMINDER_ERROR_MESSAGES: Record<string, string> = {
  P0002: 'This complaint could not be found.',
  '22023': 'Reminders are available for open complaints that are at least 48 hours old.',
  '53400': 'A reminder was sent recently. You can send another in 24 hours.',
};

export async function updateComplaintStatus(
  complaintId: string,
  status: ComplaintStatus,
  remark: string,
): Promise<void> {
  const trimmed = remark.trim();
  const { error } = await supabase.rpc('update_complaint_status', {
    p_complaint: complaintId,
    p_status: status,
    p_remark: trimmed === '' ? null : trimmed,
  });
  if (error) {
    throw new Error(STATUS_ERROR_MESSAGES[error.code ?? ''] ?? 'We could not save this update. Please try again.');
  }
}

export async function requestComplaintReminder(complaintId: string): Promise<void> {
  const { error } = await supabase.rpc('request_complaint_reminder', { p_complaint: complaintId });
  if (error) {
    throw new Error(REMINDER_ERROR_MESSAGES[error.code ?? ''] ?? 'We could not send the reminder. Please try again.');
  }
}
