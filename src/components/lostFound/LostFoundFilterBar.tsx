import { Search, SlidersHorizontal, X } from 'lucide-react';
import { SelectField, TextField } from '@/components/ui/FormFields';
import {
  LOST_FOUND_CATEGORIES,
  LOST_FOUND_CATEGORY_LABELS,
  LOST_FOUND_REPORT_LABELS,
  LOST_FOUND_REPORT_TYPES,
  LOST_FOUND_STATUS_LABELS,
} from '@/config/lostFound';
import { EMPTY_LOST_FOUND_FILTERS, type LostFoundFilters } from '@/lib/lostFound';
import type { LostFoundItemStatusFilter } from '@/types/lostFound';

interface LostFoundFilterBarProps {
  filters: LostFoundFilters;
  onChange: (next: LostFoundFilters) => void;
  resultCount: number;
  showStatus?: boolean;
}

const REPORT_TYPE_OPTIONS = LOST_FOUND_REPORT_TYPES.map((value) => ({
  value,
  label: LOST_FOUND_REPORT_LABELS[value],
}));

const CATEGORY_OPTIONS = LOST_FOUND_CATEGORIES.map((value) => ({
  value,
  label: LOST_FOUND_CATEGORY_LABELS[value],
}));

const STATUS_OPTIONS: { value: LostFoundItemStatusFilter; label: string }[] = [
  { value: 'open', label: LOST_FOUND_STATUS_LABELS.open },
  { value: 'recovered', label: LOST_FOUND_STATUS_LABELS.recovered },
];

export function LostFoundFilterBar({ filters, onChange, resultCount, showStatus = true }: LostFoundFilterBarProps) {
  const set = <K extends keyof LostFoundFilters>(key: K) => (event: { target: { value: string } }) => {
    onChange({ ...filters, [key]: event.target.value });
  };

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(EMPTY_LOST_FOUND_FILTERS);

  return (
    <div className="space-y-5 rounded-2xl border border-navy-100 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-10 h-4 w-4 text-navy-400" aria-hidden="true" />
          <TextField
            label="Search by name or description"
            name="search"
            type="search"
            placeholder="e.g. wallet, charger, blue"
            value={filters.query}
            onChange={set('query')}
            className="pl-10"
          />
        </div>
        {isFiltered && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_LOST_FOUND_FILTERS)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
          >
            <X className="h-4 w-4" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-navy-500">
        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
        Filters
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SelectField
          label="Report type"
          name="reportType"
          options={[{ value: 'all', label: 'All reports' }, ...REPORT_TYPE_OPTIONS]}
          placeholder="All reports"
          value={filters.reportType}
          onChange={set('reportType')}
        />
        <SelectField
          label="Category"
          name="category"
          options={[{ value: 'all', label: 'All categories' }, ...CATEGORY_OPTIONS]}
          placeholder="All categories"
          value={filters.category}
          onChange={set('category')}
        />
        <TextField
          label="Location contains"
          name="location"
          placeholder="e.g. Library"
          value={filters.location}
          onChange={set('location')}
        />
        {showStatus ? (
          <SelectField
            label="Status"
            name="status"
            options={[{ value: 'all', label: 'Active and recovered' }, ...STATUS_OPTIONS]}
            placeholder="Active and recovered"
            value={filters.status}
            onChange={set('status')}
          />
        ) : (
          <div aria-hidden="true" className="hidden xl:block" />
        )}
        <TextField label="Date from" name="dateFrom" type="date" value={filters.dateFrom} onChange={set('dateFrom')} />
        <TextField label="Date to" name="dateTo" type="date" value={filters.dateTo} onChange={set('dateTo')} />
      </div>

      <p className="text-sm text-navy-600" aria-live="polite">
        {resultCount === 1 ? '1 report found' : `${resultCount} reports found`}
      </p>
    </div>
  );
}
