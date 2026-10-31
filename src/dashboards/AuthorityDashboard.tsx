import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ClipboardList, Clock, CircleDot } from 'lucide-react';
import { ROLE_LABELS } from '@/config/campus';
import { CATEGORY_LABELS, ROLE_COMPLAINT_CATEGORIES } from '@/config/complaints';
import { ComplaintList } from '@/components/complaints/ComplaintList';
import { LoadErrorBanner, ModuleCard, StatCard } from '@/components/dashboard/DashboardCards';
import { Button } from '@/components/ui/Button';
import { useComplaints } from '@/hooks/useComplaints';
import { countByStatus, isComplaintDelayed } from '@/lib/complaints';
import type { Profile } from '@/types/profile';

export function AuthorityDashboard({ profile }: { profile: Profile }) {
  const navigate = useNavigate();
  const { complaints, loading, error, reload } = useComplaints();
  const scope = ROLE_COMPLAINT_CATEGORIES[profile.role].map((category) => CATEGORY_LABELS[category]).join(' and ');
  const delayed = complaints.filter((complaint) => isComplaintDelayed(complaint)).length;

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">{ROLE_LABELS[profile.role]}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
            Welcome back, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="mt-2 text-sm text-navy-600">You handle {scope} complaints.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/complaints')}>
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Open complaint queue
        </Button>
      </div>

      {error ? (
        <LoadErrorBanner message="We could not load complaints. Please try again." onRetry={() => void reload()} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Clock} label="Pending" value={String(countByStatus(complaints, 'pending'))} hint="Waiting to be picked up" />
          <StatCard icon={CircleDot} label="In progress" value={String(countByStatus(complaints, 'in_progress'))} hint="Being worked on" />
          <StatCard icon={CheckCircle2} label="Resolved" value={String(countByStatus(complaints, 'resolved'))} hint="Closed in your scope" />
          <StatCard icon={AlertTriangle} label="Delayed" value={String(delayed)} hint="Open for more than 48 hours" />
        </div>
      )}

      <ModuleCard icon={ClipboardList} title="Latest complaints">
        {loading && !error ? (
          <p className="text-sm text-navy-500">Loading complaints...</p>
        ) : error ? null : (
          <ComplaintList
            complaints={complaints.slice(0, 5)}
            showStudent
            emptyMessage="No complaints have been reported in your scope yet."
            onSelect={() => navigate('/complaints')}
          />
        )}
      </ModuleCard>
    </div>
  );
}
