import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { FullPageLoader } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, LogOut } from 'lucide-react';

export function ProtectedRoute() {
  const { session, profile, loading, profileError, refreshProfile, signOut } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!profile) {
    if (!profileError) return <FullPageLoader />;
    return <ProfileErrorState message={profileError} onRetry={refreshProfile} onSignOut={signOut} />;
  }

  return <Outlet />;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { session, loading, signInInProgress } = useAuth();
  if (loading) return <FullPageLoader />;
  if (session && !signInInProgress) return <Navigate to="/dashboard" replace />;
  return children;
}

interface ProfileErrorStateProps {
  message: string | null;
  onRetry: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

function ProfileErrorState({ message, onRetry, onSignOut }: ProfileErrorStateProps) {
  useEffect(() => {
    document.title = 'Profile unavailable | CampusConnect';
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-50/40 p-6">
      <div className="w-full max-w-md animate-fade-up rounded-3xl border border-navy-100 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-xl font-semibold text-navy-900">Your profile is unavailable</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          {message ?? 'We could not load your profile right now.'}
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button onClick={() => void onRetry()}>
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button variant="secondary" onClick={() => void onSignOut()}>
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
