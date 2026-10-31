import { CheckCircle2, CircleDot, Clock } from 'lucide-react';
import { STATUS_LABELS, type ComplaintStatus } from '@/config/complaints';

const STATUS_STYLES: Record<ComplaintStatus, { classes: string; icon: typeof Clock }> = {
  pending: { classes: 'bg-amber-100 text-amber-800', icon: Clock },
  in_progress: { classes: 'bg-sky-100 text-sky-800', icon: CircleDot },
  resolved: { classes: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
};

export function ComplaintStatusBadge({ status }: { status: ComplaintStatus }) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.classes}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {STATUS_LABELS[status]}
    </span>
  );
}
