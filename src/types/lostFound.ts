import type { LostFoundCategory, LostFoundItemStatus, LostFoundReportType } from '@/config/lostFound';

export interface LostFoundItem {
  id: string;
  report_type: LostFoundReportType;
  name: string;
  category: LostFoundCategory;
  description: string;
  location: string;
  item_date: string;
  approx_time: string | null;
  image_path: string | null;
  status: LostFoundItemStatus;
  recovered_at: string | null;
  created_at: string;
  updated_at: string;
}

export type LostFoundItemStatusFilter = 'all' | 'open' | 'recovered';

export type LostFoundMatchStatus = 'suggested' | 'confirmed' | 'dismissed' | 'closed';

export interface LostFoundMatch {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  score: number;
  name_similarity: number;
  description_similarity: number;
  location_similarity: number;
  category_score: number;
  date_score: number;
  status: LostFoundMatchStatus;
  responded_at: string | null;
  created_at: string;
}

export type LostFoundHistoryKind =
  | 'created'
  | 'match_suggested'
  | 'match_confirmed'
  | 'match_dismissed'
  | 'recovered';

export interface LostFoundHistoryEntry {
  id: string;
  item_id: string;
  match_id: string | null;
  actor_role: string | null;
  kind: LostFoundHistoryKind;
  created_at: string;
}

export type NotificationKind =
  | 'lost_found_match_suggested'
  | 'lost_found_match_confirmed'
  | 'lost_found_item_recovered';

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body: string;
  item_id: string | null;
  match_id: string | null;
  read_at: string | null;
  created_at: string;
}
