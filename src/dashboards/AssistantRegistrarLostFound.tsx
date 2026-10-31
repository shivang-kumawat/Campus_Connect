import { useEffect, useMemo, useState } from 'react';
import { Eye, PackageCheck, PackageSearch, Percent, Sparkles } from 'lucide-react';
import { EmptyModule, LoadErrorBanner, StatCard } from '@/components/dashboard/DashboardCards';
import { LostFoundFilterBar } from '@/components/lostFound/LostFoundFilterBar';
import { useLostFound } from '@/hooks/useLostFound';
import {
  categoryLabel,
  countByReportType,
  EMPTY_LOST_FOUND_FILTERS,
  filterLostFoundItems,
  formatItemDate,
  formatSimilarity,
  formatTimestamp,
  recoveryRate,
  type LostFoundFilters,
} from '@/lib/lostFound';
import { LOST_FOUND_REPORT_LABELS, LOST_FOUND_STATUS_LABELS } from '@/config/lostFound';
import type { LostFoundItem, LostFoundMatch, LostFoundMatchStatus } from '@/types/lostFound';

const MATCH_STATUS_LABELS: Record<LostFoundMatchStatus, string> = {
  suggested: 'Awaiting students',
  confirmed: 'Confirmed',
  dismissed: 'Dismissed',
  closed: 'Closed (item recovered)',
};

const RECENT_LIMIT = 10;

export function AssistantRegistrarLostFound() {
  const { items, matches, loading, error, reload } = useLostFound({
    includeOwned: false,
    includeNotifications: false,
  });
  const [filters, setFilters] = useState<LostFoundFilters>(EMPTY_LOST_FOUND_FILTERS);

  useEffect(() => {
    document.title = 'Lost & Found monitoring | CampusConnect';
  }, []);

  const counts = countByReportType(items);
  const active = items.filter((item) => item.status === 'open').length;
  const recovered = items.length - active;
  const suggested = matches.filter((match) => match.status === 'suggested').length;
  const rate = recoveryRate(items);

  const filtered = useMemo(() => filterLostFoundItems(items, filters), [items, filters]);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const recentReports = filtered.slice(0, RECENT_LIMIT);
  const matchRows = useMemo(
    () =>
      matches
        .filter((match) => {
          const lost = itemsById.get(match.lost_item_id);
          const found = itemsById.get(match.found_item_id);
          return lost && found && (filtersMatchItem(lost, filters) || filtersMatchItem(found, filters));
        })
        .slice(0, RECENT_LIMIT),
    [matches, itemsById, filters],
  );

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-sky-700">Assistant Registrar</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">Lost & Found monitoring</h1>
        <p className="mt-2 flex max-w-2xl items-start gap-2 text-sm text-navy-600">
          <Eye className="mt-0.5 h-4 w-4 shrink-0 text-navy-500" aria-hidden="true" />
          Read-only view. You can review reports and matches but cannot file, confirm, dismiss or recover items.
        </p>
      </div>

      {error ? (
        <LoadErrorBanner message="We could not load the Lost & Found records." onRetry={() => void reload()} />
      ) : loading ? (
        <p className="text-sm text-navy-500">Loading Lost & Found records...</p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard icon={PackageSearch} label="Lost reports" value={String(counts.lost)} hint="All lost reports filed" />
            <StatCard icon={PackageSearch} label="Found reports" value={String(counts.found)} hint="All found reports filed" />
            <StatCard icon={PackageSearch} label="Active reports" value={String(active)} hint="Not yet recovered" />
            <StatCard icon={Sparkles} label="Possible matches" value={String(suggested)} hint="Suggested and awaiting students" />
            <StatCard icon={PackageCheck} label="Recovered items" value={String(recovered)} hint="Marked as returned" />
            <StatCard icon={Percent} label="Recovery rate" value={`${rate}%`} hint="Recovered out of all reports" />
          </div>

          <LostFoundFilterBar filters={filters} onChange={setFilters} resultCount={filtered.length} />

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-navy-900">Recent reports</h2>
            {recentReports.length === 0 ? (
              <EmptyModule message="No reports match these filters." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
                <table className="min-w-full divide-y divide-navy-100 text-left text-sm">
                  <thead className="bg-navy-50/70 text-xs font-semibold uppercase tracking-wide text-navy-600">
                    <tr>
                      <th className="px-5 py-3">Item</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Location</th>
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {recentReports.map((item) => (
                      <ReportRow key={item.id} item={item} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-base font-semibold text-navy-900">Match history</h2>
            {matchRows.length === 0 ? (
              <EmptyModule message="No matches match these filters." />
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-navy-100 bg-white shadow-card">
                <table className="min-w-full divide-y divide-navy-100 text-left text-sm">
                  <thead className="bg-navy-50/70 text-xs font-semibold uppercase tracking-wide text-navy-600">
                    <tr>
                      <th className="px-5 py-3">Lost item</th>
                      <th className="px-5 py-3">Found item</th>
                      <th className="px-5 py-3">Similarity</th>
                      <th className="px-5 py-3">Status</th>
                      <th className="px-5 py-3">Suggested</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {matchRows.map((match) => (
                      <MatchRow key={match.id} match={match} itemsById={itemsById} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function filtersMatchItem(item: LostFoundItem, filters: LostFoundFilters): boolean {
  return filterLostFoundItems([item], filters).length === 1;
}

function ReportRow({ item }: { item: LostFoundItem }) {
  return (
    <tr className="text-navy-800">
      <td className="px-5 py-3 font-medium text-navy-900">{item.name}</td>
      <td className="px-5 py-3">{LOST_FOUND_REPORT_LABELS[item.report_type]}</td>
      <td className="px-5 py-3">{categoryLabel(item.category)}</td>
      <td className="px-5 py-3">{item.location}</td>
      <td className="whitespace-nowrap px-5 py-3">{formatItemDate(item.item_date)}</td>
      <td className="px-5 py-3">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            item.status === 'recovered' ? 'bg-emerald-50 text-emerald-700' : 'bg-sky-50 text-sky-700'
          }`}
        >
          {LOST_FOUND_STATUS_LABELS[item.status]}
        </span>
      </td>
    </tr>
  );
}

function MatchRow({ match, itemsById }: { match: LostFoundMatch; itemsById: Map<string, LostFoundItem> }) {
  const lost = itemsById.get(match.lost_item_id);
  const found = itemsById.get(match.found_item_id);
  return (
    <tr className="text-navy-800">
      <td className="px-5 py-3 font-medium text-navy-900">{lost?.name ?? 'Unavailable'}</td>
      <td className="px-5 py-3 font-medium text-navy-900">{found?.name ?? 'Unavailable'}</td>
      <td className="px-5 py-3">{formatSimilarity(match.score)}</td>
      <td className="px-5 py-3">{MATCH_STATUS_LABELS[match.status]}</td>
      <td className="whitespace-nowrap px-5 py-3">{formatTimestamp(match.created_at)}</td>
    </tr>
  );
}
