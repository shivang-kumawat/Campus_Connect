import { CheckCircle2, Clock, XCircle, type LucideIcon } from 'lucide-react';
import type { VerificationStatus } from '@/types/profile';

const STATUS_STYLES: Record<VerificationStatus, { label: string; classes: string; icon: LucideIcon }> = {
  not_required: { label: 'Not required', classes: 'bg-navy-100 text-navy-700', icon: CheckCircle2 },
  pending: { label: 'Pending review', classes: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'Verified', classes: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  rejected: { label: 'Not verified', classes: 'bg-rose-100 text-rose-800', icon: XCircle },
};

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  const style = STATUS_STYLES[status];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${style.classes}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {style.label}
    </span>
  );
}
