import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadErrorBanner, ModuleCard, StatCard } from '@/components/dashboard/DashboardCards';
import { ComplaintDetailModal } from '@/components/complaints/ComplaintDetailModal';
import { ComplaintList } from '@/components/complaints/ComplaintList';
import { ReportComplaintModal } from '@/components/complaints/ReportComplaintModal';
import { useComplaints } from '@/hooks/useComplaints';
import { countByStatus } from '@/lib/complaints';
import type { Profile } from '@/types/profile';

export function StudentComplaints({ profile }: { profile: Profile }) {
  const { complaints, loading, error, reload } = useComplaints();
  const [reporting, setReporting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = complaints.find((complaint) => complaint.id === selectedId) ?? null;
  const open = countByStatus(complaints, 'pending') + countByStatus(complaints, 'in_progress');

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Student services</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">My complaints</h1>
          <p className="mt-2 text-sm text-navy-600">Report hostel, internet and mess issues and follow each one until it is resolved.</p>
        </div>
        <Button onClick={() => setReporting(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Report an issue
        </Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <StatCard icon={ClipboardList} label="Total reported" value={String(complaints.length)} hint="All your complaints" />
        <StatCard icon={ClipboardList} label="Open" value={String(open)} hint="Pending or in progress" />
        <StatCard icon={ClipboardList} label="Resolved" value={String(countByStatus(complaints, 'resolved'))} hint="Completed by authorities" />
      </div>

      <ModuleCard icon={ClipboardList} title="Your complaints">
        {error ? (
          <LoadErrorBanner message="We could not load your complaints. Please try again." onRetry={() => void reload()} />
        ) : loading ? (
          <p className="text-sm text-navy-500">Loading complaints...</p>
        ) : (
          <ComplaintList
            complaints={complaints}
            emptyMessage="You have not reported any issues yet."
            onSelect={(complaint) => setSelectedId(complaint.id)}
          />
        )}
      </ModuleCard>

      {reporting && (
        <ReportComplaintModal
          profile={profile}
          onClose={() => setReporting(false)}
          onCreated={async () => {
            setReporting(false);
            await reload();
          }}
        />
      )}

      {selected && (
        <ComplaintDetailModal
          complaint={selected}
          canUpdate={false}
          canRemind
          onChanged={reload}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
