import { supabase } from '@/lib/supabase';
import {
  LOST_FOUND_CATEGORIES,
  LOST_FOUND_DESCRIPTION_LENGTH,
  LOST_FOUND_IMAGE_BUCKET,
  LOST_FOUND_IMAGE_MAX_BYTES,
  LOST_FOUND_IMAGE_TYPES,
  LOST_FOUND_LOCATION_LENGTH,
  LOST_FOUND_NAME_LENGTH,
  type LostFoundCategory,
  type LostFoundReportType,
} from '@/config/lostFound';
import type {
  AppNotification,
  LostFoundHistoryEntry,
  LostFoundItem,
  LostFoundMatch,
} from '@/types/lostFound';

const ITEM_COLUMNS =
  'id, report_type, name, category, description, location, item_date, approx_time, image_path, status, recovered_at, created_at, updated_at';
const MATCH_COLUMNS =
  'id, lost_item_id, found_item_id, score, name_similarity, description_similarity, location_similarity, category_score, date_score, status, responded_at, created_at';
const HISTORY_COLUMNS = 'id, item_id, match_id, actor_role, kind, created_at';
const NOTIFICATION_COLUMNS = 'id, kind, title, body, item_id, match_id, read_at, created_at';
const SIGNED_URL_SECONDS = 300;

const IMAGE_EXTENSIONS: Record<(typeof LOST_FOUND_IMAGE_TYPES)[number], string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export async function listLostFoundItems(): Promise<LostFoundItem[]> {
  const { data, error } = await supabase
    .from('lost_found_items')
    .select(ITEM_COLUMNS)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LostFoundItem[];
}

export async function listOwnedItemIds(): Promise<string[]> {
  const { data, error } = await supabase.from('lost_found_owners').select('item_id');
  if (error) throw error;
  return (data ?? []).map((row) => row.item_id as string);
}

export async function listLostFoundMatches(): Promise<LostFoundMatch[]> {
  const { data, error } = await supabase
    .from('lost_found_matches')
    .select(MATCH_COLUMNS)
    .order('score', { ascending: false });
  if (error) throw error;
  return (data ?? []) as LostFoundMatch[];
}

export async function listLostFoundHistory(): Promise<LostFoundHistoryEntry[]> {
  const { data, error } = await supabase
    .from('lost_found_history')
    .select(HISTORY_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as LostFoundHistoryEntry[];
}

export async function listNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_COLUMNS)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as AppNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .is('read_at', null);
  if (error) throw new Error('We could not update this notification. Please try again.');
}

export async function getLostFoundImageUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(LOST_FOUND_IMAGE_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error || !data?.signedUrl) throw new Error('We could not load this photo.');
  return data.signedUrl;
}

export function validateLostFoundImage(file: File): string | null {
  if (!(LOST_FOUND_IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return 'Upload a JPEG, PNG or WebP image.';
  }
  if (file.size > LOST_FOUND_IMAGE_MAX_BYTES) {
    return 'Photos must be 5 MB or smaller.';
  }
  return null;
}

export interface NewLostFoundReportInput {
  studentId: string;
  reportType: LostFoundReportType;
  name: string;
  category: LostFoundCategory;
  description: string;
  location: string;
  itemDate: string;
  approxTime: string;
  image: File | null;
}

export function validateLostFoundReport(input: NewLostFoundReportInput): string | null {
  const name = input.name.trim();
  const description = input.description.trim();
  const location = input.location.trim();
  if (name.length < LOST_FOUND_NAME_LENGTH.min || name.length > LOST_FOUND_NAME_LENGTH.max) {
    return `Item name must be ${LOST_FOUND_NAME_LENGTH.min} to ${LOST_FOUND_NAME_LENGTH.max} characters.`;
  }
  if (!(LOST_FOUND_CATEGORIES as readonly string[]).includes(input.category)) {
    return 'Choose a category.';
  }
  if (description.length < LOST_FOUND_DESCRIPTION_LENGTH.min || description.length > LOST_FOUND_DESCRIPTION_LENGTH.max) {
    return `Description must be ${LOST_FOUND_DESCRIPTION_LENGTH.min} to ${LOST_FOUND_DESCRIPTION_LENGTH.max} characters.`;
  }
  if (location.length < LOST_FOUND_LOCATION_LENGTH.min || location.length > LOST_FOUND_LOCATION_LENGTH.max) {
    return `Location must be ${LOST_FOUND_LOCATION_LENGTH.min} to ${LOST_FOUND_LOCATION_LENGTH.max} characters.`;
  }
  if (!input.itemDate || input.itemDate > new Date().toISOString().slice(0, 10)) {
    return 'The date cannot be in the future.';
  }
  if (input.image) return validateLostFoundImage(input.image);
  return null;
}

const REPORT_ERROR_MESSAGES: Record<string, string> = {
  '42501': 'Only students can file Lost & Found reports.',
  '23514': 'Check the details and try again. The date cannot be in the future.',
  '22001': 'One of the fields is too long.',
};

export async function createLostFoundReport(input: NewLostFoundReportInput): Promise<void> {
  const validationError = validateLostFoundReport(input);
  if (validationError) throw new Error(validationError);

  const itemId = crypto.randomUUID();
  let imagePath: string | null = null;

  if (input.image) {
    const extension = IMAGE_EXTENSIONS[input.image.type as (typeof LOST_FOUND_IMAGE_TYPES)[number]];
    imagePath = `${input.studentId}/${itemId}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from(LOST_FOUND_IMAGE_BUCKET)
      .upload(imagePath, input.image, { contentType: input.image.type, upsert: false });
    if (uploadError) throw new Error('We could not upload the photo. Please try again.');
  }

  const { error } = await supabase.from('lost_found_items').insert({
    id: itemId,
    report_type: input.reportType,
    name: input.name.trim(),
    category: input.category,
    description: input.description.trim(),
    location: input.location.trim(),
    item_date: input.itemDate,
    approx_time: input.approxTime || null,
    image_path: imagePath,
  });

  if (error) {
    if (imagePath) await supabase.storage.from(LOST_FOUND_IMAGE_BUCKET).remove([imagePath]);
    throw new Error(REPORT_ERROR_MESSAGES[error.code ?? ''] ?? 'We could not save your report. Please try again.');
  }
}

const RESPONSE_ERROR_MESSAGES: Record<string, string> = {
  '42501': 'You are not allowed to respond to this match.',
  P0002: 'This match could not be found.',
  '22023': 'This match has already been answered.',
};

export async function respondToLostFoundMatch(matchId: string, decision: 'confirm' | 'dismiss'): Promise<void> {
  const { error } = await supabase.rpc('respond_lost_found_match', { p_match: matchId, p_decision: decision });
  if (error) {
    throw new Error(RESPONSE_ERROR_MESSAGES[error.code ?? ''] ?? 'We could not save your response. Please try again.');
  }
}

const RECOVERY_ERROR_MESSAGES: Record<string, string> = {
  '42501': 'Only the student who reported this item can mark it recovered.',
  P0002: 'This item could not be found.',
  '22023': 'This item is already marked as recovered.',
};

export async function markLostFoundItemRecovered(itemId: string): Promise<void> {
  const { error } = await supabase.rpc('mark_lost_found_recovered', { p_item: itemId });
  if (error) {
    throw new Error(RECOVERY_ERROR_MESSAGES[error.code ?? ''] ?? 'We could not mark this item recovered. Please try again.');
  }
}
