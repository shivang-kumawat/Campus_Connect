import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu } from 'lucide-react';
import { Sidebar, SidebarContent } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { ROLE_LABELS } from '@/config/campus';

export function DashboardLayout() {
  const { profile, signOut } = useAuth();
  const { notify } = useToast();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const initials = (profile?.full_name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  async function handleSignOut() {
    try {
      await signOut();
    } catch {
      notify('We could not sign you out. Please try again.', 'error');
    }
  }

  return (
    <div className="min-h-screen bg-navy-50/40">
      <Sidebar />

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-navy-950/40 backdrop-blur-sm animate-fade-up"
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] animate-fade-up bg-white shadow-lift">
            <SidebarContent onClose={() => setDrawerOpen(false)} onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-navy-100 bg-white/85 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="rounded-lg p-2 text-navy-600 transition hover:bg-navy-50 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex-1" />

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-800 text-xs font-semibold text-sky-200">
                  {initials || '?'}
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold leading-tight text-navy-900">{profile?.full_name}</p>
                  <p className="text-xs text-navy-500">{profile ? ROLE_LABELS[profile.role] : ''}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleSignOut} aria-label="Sign out">
                <LogOut className="h-4 w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-8 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
