export const LOST_FOUND_CATEGORIES = [
  'electronics',
  'wallets',
  'id_cards',
  'books_stationery',
  'bags',
  'clothing',
  'accessories',
  'other',
] as const;

export type LostFoundCategory = (typeof LOST_FOUND_CATEGORIES)[number];

export const LOST_FOUND_CATEGORY_LABELS: Record<LostFoundCategory, string> = {
  electronics: 'Electronics',
  wallets: 'Wallets',
  id_cards: 'ID Cards',
  books_stationery: 'Books & Stationery',
  bags: 'Bags',
  clothing: 'Clothing',
  accessories: 'Accessories',
  other: 'Other',
};

export const LOST_FOUND_REPORT_TYPES = ['lost', 'found'] as const;
export type LostFoundReportType = (typeof LOST_FOUND_REPORT_TYPES)[number];

export const LOST_FOUND_REPORT_LABELS: Record<LostFoundReportType, string> = {
  lost: 'Lost',
  found: 'Found',
};

export const LOST_FOUND_STATUS_LABELS = {
  open: 'Active',
  recovered: 'Recovered',
} as const;

export type LostFoundItemStatus = keyof typeof LOST_FOUND_STATUS_LABELS;

export const LOST_FOUND_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const LOST_FOUND_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const LOST_FOUND_NAME_LENGTH = { min: 3, max: 80 } as const;
export const LOST_FOUND_DESCRIPTION_LENGTH = { min: 10, max: 1000 } as const;
export const LOST_FOUND_LOCATION_LENGTH = { min: 3, max: 120 } as const;

export const LOST_FOUND_IMAGE_BUCKET = 'lost-found-images';
