import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, ClipboardList, PackageSearch, Utensils } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useComplaints } from '@/hooks/useComplaints';
import { LoadErrorBanner, ModuleCard, StatCard } from '@/components/dashboard/DashboardCards';
import { ComplaintList } from '@/components/complaints/ComplaintList';
import { VerificationBadge } from '@/components/verification/VerificationBadge';
import { countByStatus } from '@/lib/complaints';
import type { Profile } from '@/types/profile';

function greetingName(profile: Profile) {
  return profile.full_name.split(' ')[0];
}

function hostelHint(profile: Profile) {
  switch (profile.verification_status) {
    case 'pending':
      return 'Waiting for your hostel warden to verify';
    case 'approved':
      return 'Verified by your hostel warden';
    case 'rejected':
      return 'Not verified. See your profile for the remark';
    default:
      return 'Hostel verification';
  }
}

export function StudentDashboard({ profile }: { profile: Profile }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { complaints, loading, error, reload } = useComplaints();
  const open = countByStatus(complaints, 'pending') + countByStatus(complaints, 'in_progress');
  const recent = complaints.slice(0, 3);

  useEffect(() => {
    document.title = 'Dashboard | CampusConnect';
  }, []);

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-sky-700">Student dashboard</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
          Welcome back, {greetingName(profile)}
        </h1>
        <p className="mt-2 text-sm text-navy-600">
          Signed in as {session?.user.email}. Your hostel and mess details are below.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={Building2} label="Hostel" value={profile.hostel ?? 'Not set'} hint={hostelHint(profile)} />
        <StatCard icon={Utensils} label="Mess" value={profile.mess ?? 'Not set'} hint="Used for mess-related complaints" />
        <StatCard
          icon={ClipboardList}
          label="Complaints"
          value={String(complaints.length)}
          hint={`${open} open · ${countByStatus(complaints, 'resolved')} resolved`}
        />
      </div>

      <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-navy-900">Hostel verification</p>
            <p className="mt-1 text-sm text-navy-600">
              {profile.verification_status === 'approved'
                ? 'Your hostel warden has confirmed your allotment.'
                : profile.verification_status === 'rejected'
                  ? 'Your hostel warden could not verify your allotment. Check the remark on your profile.'
                  : 'Your hostel warden will confirm that your hostel allotment is correct.'}
            </p>
          </div>
          <VerificationBadge status={profile.verification_status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ModuleCard icon={ClipboardList} title="Recent complaints">
          {error ? (
            <LoadErrorBanner message="We could not load your complaints." onRetry={() => void reload()} />
          ) : loading ? (
            <p className="text-sm text-navy-500">Loading complaints...</p>
          ) : (
            <ComplaintList
              complaints={recent}
              emptyMessage="No complaints yet. Report an issue from My complaints."
              onSelect={() => navigate('/complaints')}
            />
          )}
        </ModuleCard>
        <ModuleCard icon={PackageSearch} title="Lost & Found activity">
          <div className="space-y-4">
            <p className="text-sm text-navy-600">
              Report a lost or found item, and review any possible matches that similar reports produce.
            </p>
            <Link
              to="/lost-found"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy-800 underline-offset-4 hover:underline"
            >
              Open Lost & Found
            </Link>
          </div>
        </ModuleCard>
      </div>

      <p className="text-sm text-navy-500">
        Need to update your name or mess? Visit your{' '}
        <Link to="/profile" className="font-semibold text-navy-800 underline-offset-4 hover:underline">
          profile
        </Link>
        .
      </p>
    </div>
  );
}
