import { BellRing, CircleDot, MessageSquare, Send } from 'lucide-react';
import { ROLE_LABELS } from '@/config/campus';
import { STATUS_LABELS } from '@/config/complaints';
import { formatComplaintDate } from '@/lib/complaints';
import type { ComplaintUpdate } from '@/types/complaint';

function describeUpdate(update: ComplaintUpdate) {
  const actor = update.actor_role ? ROLE_LABELS[update.actor_role] : 'System';
  if (update.kind === 'created') return { title: 'Complaint reported', actor, icon: Send };
  if (update.kind === 'reminder') return { title: 'Reminder sent', actor, icon: BellRing };
  const statusText = update.status ? `Marked as ${STATUS_LABELS[update.status]}` : 'Status updated';
  return { title: statusText, actor, icon: CircleDot };
}

export function ComplaintTimeline({ updates }: { updates: ComplaintUpdate[] }) {
  if (updates.length === 0) {
    return <p className="text-sm text-navy-500">No updates yet.</p>;
  }

  return (
    <ol className="relative space-y-5 border-l border-navy-100 pl-6">
      {updates.map((update) => {
        const { title, actor, icon: Icon } = describeUpdate(update);
        return (
          <li key={update.id} className="relative">
            <span className="absolute -left-[37px] flex h-6 w-6 items-center justify-center rounded-full bg-sky-50 text-navy-700 ring-4 ring-white">
              <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-navy-900">{title}</p>
            <p className="mt-0.5 text-xs text-navy-500">
              {actor} · {formatComplaintDate(update.created_at)}
            </p>
            {update.remark && (
              <p className="mt-2 flex gap-2 rounded-lg bg-navy-50 px-3 py-2 text-sm text-navy-700">
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-navy-400" aria-hidden="true" />
                <span className="break-words">{update.remark}</span>
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
