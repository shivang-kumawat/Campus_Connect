import { NavLink } from 'react-router-dom';
import { X } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { getDashboardNav } from '@/config/navigation';
import { useAuth } from '@/hooks/useAuth';

interface SidebarProps {
  onNavigate?: () => void;
  onClose?: () => void;
}

export function SidebarContent({ onNavigate, onClose }: SidebarProps) {
  const { profile } = useAuth();
  const navItems = profile ? getDashboardNav(profile.role) : [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-6">
        <Logo />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-navy-500 transition hover:bg-navy-50 hover:text-navy-800"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label="Main navigation">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition duration-200 ${
                isActive
                  ? 'bg-navy-800 text-white shadow-sm'
                  : 'text-navy-600 hover:bg-navy-50 hover:text-navy-900'
              }`
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-3 mb-4 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 p-4 text-white">
        <p className="text-sm font-semibold">Need help?</p>
        <p className="mt-1 text-xs leading-relaxed text-navy-200">
          Report lost or found items and review possible matches under Lost &amp; Found.
        </p>
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-navy-100 bg-white lg:block">
      <SidebarContent />
    </aside>
  );
}
