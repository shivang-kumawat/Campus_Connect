import type { ReactNode } from 'react';
import { Landmark } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const CAMPUS_BACKGROUND_URL =
  'https://images.pexels.com/photos/2305098/pexels-photo-2305098.jpeg?auto=compress&cs=tinysrgb&w=1920';

interface PortalShellProps {
  children: ReactNode;
}

export function PortalShell({ children }: PortalShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="pointer-events-none fixed inset-0">
        <img src={CAMPUS_BACKGROUND_URL} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-900/75 to-navy-950/90" />
      </div>

      <header className="relative bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-sky-200">
              <Landmark className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-navy-900 sm:text-base">
                The LNM Institute of Information Technology
              </p>
              <p className="text-sm text-navy-600">Smart Campus Management Platform</p>
            </div>
          </div>
          <Logo />
        </div>
        <div className="h-1 bg-gradient-to-r from-sky-600 via-navy-700 to-rose-600" aria-hidden="true" />
      </header>

      <main className="relative flex flex-1 items-center justify-center px-4 py-12 sm:px-6">{children}</main>

      <footer className="relative bg-navy-900 px-6 py-5 text-sm text-navy-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
          <p className="font-semibold text-white">CampusConnect - LNMIIT Smart Campus Platform</p>
          <p className="text-navy-200">
            &copy; {new Date().getFullYear()} The LNM Institute of Information Technology. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

interface PortalCardProps {
  aside: ReactNode;
  children: ReactNode;
}

export function PortalCard({ aside, children }: PortalCardProps) {
  return (
    <div className="grid w-full max-w-4xl animate-fade-up overflow-hidden rounded-3xl bg-white shadow-lift md:grid-cols-[1fr_1.1fr]">
      {aside}
      <section className="p-8 md:p-10">{children}</section>
    </div>
  );
}
