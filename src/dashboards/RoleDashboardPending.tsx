import { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { ROLE_LABELS } from '@/config/campus';

export function RoleDashboardPending() {
  const { profile } = useAuth();

  useEffect(() => {
    document.title = 'Dashboard | CampusConnect';
  }, []);

  return (
    <div className="mx-auto max-w-xl py-16 text-center animate-fade-up">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-navy-700">
        <Clock className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-navy-900">
        {profile ? ROLE_LABELS[profile.role] : 'Your'} dashboard is coming soon
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-navy-600">
        Your account is set up. The tools for this role will be added in an upcoming release.
      </p>
    </div>
  );
}
