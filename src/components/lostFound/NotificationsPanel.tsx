import { Bell, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatTimestamp } from '@/lib/lostFound';
import type { AppNotification } from '@/types/lostFound';

interface NotificationsPanelProps {
  notifications: AppNotification[];
  pendingId: string | null;
  onMarkRead: (notification: AppNotification) => void;
}

export function NotificationsPanel({ notifications, pendingId, onMarkRead }: NotificationsPanelProps) {
  if (notifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-10 text-center">
        <Bell className="mx-auto h-6 w-6 text-navy-400" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-navy-900">No notifications</p>
        <p className="mt-1 text-sm text-navy-600">You will be notified here when a possible match or update appears.</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-navy-100 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
      {notifications.map((notification) => {
        const unread = notification.read_at === null;
        return (
          <li key={notification.id} className={`flex gap-4 px-5 py-4 ${unread ? 'bg-sky-50/50' : ''}`}>
            <span
              className={`mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                unread ? 'bg-sky-100 text-sky-700' : 'bg-navy-50 text-navy-400'
              }`}
              aria-hidden="true"
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-navy-900">{notification.title}</p>
                {unread && (
                  <span className="rounded-full bg-sky-600 px-2 py-0.5 text-[11px] font-semibold text-white">New</span>
                )}
              </div>
              <p className="text-sm text-navy-700">{notification.body}</p>
              <p className="text-xs text-navy-500">{formatTimestamp(notification.created_at)}</p>
            </div>
            {unread && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkRead(notification)}
                loading={pendingId === notification.id}
                className="shrink-0"
              >
                <Check className="h-4 w-4" aria-hidden="true" />
                Mark read
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
