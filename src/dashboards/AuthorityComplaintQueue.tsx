import { useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { CATEGORY_LABELS, COMPLAINT_STATUSES, ROLE_COMPLAINT_CATEGORIES, STATUS_LABELS, type ComplaintCategory, type ComplaintStatus } from '@/config/complaints';
import type { Role } from '@/config/campus';
import { ComplaintDetailModal } from '@/components/complaints/ComplaintDetailModal';
import { ComplaintList } from '@/components/complaints/ComplaintList';
import { LoadErrorBanner, ModuleCard } from '@/components/dashboard/DashboardCards';
import { useComplaints } from '@/hooks/useComplaints';
import { isComplaintDelayed } from '@/lib/complaints';

type StatusFilter = ComplaintStatus | 'all' | 'delayed';

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  ...COMPLAINT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
  { value: 'delayed', label: 'Delayed' },
];

export function AuthorityComplaintQueue({ role }: { role: Role }) {
  const { complaints, loading, error, reload } = useComplaints();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<ComplaintCategory | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const categories = ROLE_COMPLAINT_CATEGORIES[role];
  const selected = complaints.find((complaint) => complaint.id === selectedId) ?? null;

  const visible = complaints.filter((complaint) => {
    if (categoryFilter !== 'all' && complaint.category !== categoryFilter) return false;
    if (statusFilter === 'delayed') return isComplaintDelayed(complaint);
    if (statusFilter !== 'all' && complaint.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-sky-700">Complaint management</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">Complaint queue</h1>
        <p className="mt-2 text-sm text-navy-600">Review complaints in your scope, record remarks and move each one forward.</p>
      </div>

      <ModuleCard icon={ClipboardList} title="Complaints">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  aria-pressed={statusFilter === filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition duration-200 ${
                    statusFilter === filter.value ? 'bg-navy-800 text-white shadow-sm' : 'bg-navy-50 text-navy-700 hover:bg-navy-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
            {categories.length > 1 && (
              <label className="flex items-center gap-2 text-sm text-navy-700">
                Category
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value as ComplaintCategory | 'all')}
                  className="h-9 rounded-lg border border-navy-200 bg-white px-2.5 text-sm text-navy-900 focus:border-sky-500 focus:outline-none focus:ring-4 focus:ring-sky-100"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {error ? (
            <LoadErrorBanner message="We could not load complaints. Please try again." onRetry={() => void reload()} />
          ) : loading ? (
            <p className="text-sm text-navy-500">Loading complaints...</p>
          ) : (
            <ComplaintList
              complaints={visible}
              showStudent
              emptyMessage="No complaints match these filters."
              onSelect={(complaint) => setSelectedId(complaint.id)}
            />
          )}
        </div>
      </ModuleCard>

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          canUpdate
          canRemind={false}
          onChanged={reload}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
