import { LOST_FOUND_CATEGORY_LABELS, type LostFoundCategory, type LostFoundReportType } from '@/config/lostFound';
import type { LostFoundItem, LostFoundItemStatusFilter, LostFoundMatch } from '@/types/lostFound';

export interface LostFoundFilters {
  query: string;
  reportType: LostFoundReportType | 'all';
  category: LostFoundCategory | 'all';
  location: string;
  dateFrom: string;
  dateTo: string;
  status: LostFoundItemStatusFilter;
}

export const EMPTY_LOST_FOUND_FILTERS: LostFoundFilters = {
  query: '',
  reportType: 'all',
  category: 'all',
  location: '',
  dateFrom: '',
  dateTo: '',
  status: 'all',
};

export function filterLostFoundItems(items: LostFoundItem[], filters: LostFoundFilters): LostFoundItem[] {
  const query = filters.query.trim().toLowerCase();
  const location = filters.location.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.reportType !== 'all' && item.report_type !== filters.reportType) return false;
    if (filters.category !== 'all' && item.category !== filters.category) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.dateFrom && item.item_date < filters.dateFrom) return false;
    if (filters.dateTo && item.item_date > filters.dateTo) return false;
    if (location && !item.location.toLowerCase().includes(location)) return false;
    if (query && !`${item.name} ${item.description}`.toLowerCase().includes(query)) return false;
    return true;
  });
}

export function formatSimilarity(score: number): string {
  return `${Math.round(score * 100)}%`;
}

export function categoryLabel(category: LostFoundCategory): string {
  return LOST_FOUND_CATEGORY_LABELS[category];
}

export function formatItemDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatApproxTime(time: string | null): string | null {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
}

export function matchesInvolvingItems(matches: LostFoundMatch[], itemIds: string[]): LostFoundMatch[] {
  const ids = new Set(itemIds);
  return matches.filter((match) => ids.has(match.lost_item_id) || ids.has(match.found_item_id));
}

export function countByReportType(items: LostFoundItem[]) {
  return {
    lost: items.filter((item) => item.report_type === 'lost').length,
    found: items.filter((item) => item.report_type === 'found').length,
  };
}

export function recoveryRate(items: LostFoundItem[]): number {
  if (items.length === 0) return 0;
  const recovered = items.filter((item) => item.status === 'recovered').length;
  return Math.round((recovered / items.length) * 100);
}
