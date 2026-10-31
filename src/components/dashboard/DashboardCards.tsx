import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function StatCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="group rounded-2xl border border-navy-100 bg-white p-5 shadow-card transition duration-300 hover:-translate-y-0.5 hover:shadow-lift">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-navy-700 transition group-hover:bg-navy-800 group-hover:text-sky-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-xl font-semibold text-navy-900">{value}</p>
      <p className="mt-1 text-xs text-navy-500">{hint}</p>
    </div>
  );
}

export function ModuleCard({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-navy-100 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-800 text-sky-200">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function EmptyModule({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-5 py-8 text-center">
      <p className="text-sm font-medium text-navy-700">{message}</p>
    </div>
  );
}

export function LoadErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-rose-800">{message}</p>
      <Button size="sm" variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}
