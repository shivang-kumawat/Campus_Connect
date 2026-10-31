import { useCallback, useEffect, useState } from 'react';
import { BellRing, CalendarClock, MapPin, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ComplaintPhoto } from '@/components/complaints/ComplaintPhoto';
import { ComplaintStatusBadge } from '@/components/complaints/ComplaintStatusBadge';
import { ComplaintTimeline } from '@/components/complaints/ComplaintTimeline';
import { StatusUpdateForm } from '@/components/complaints/StatusUpdateForm';
import { CATEGORY_LABELS } from '@/config/complaints';
import { useToast } from '@/hooks/useToast';
import { complaintLocation, formatComplaintDate, isComplaintDelayed } from '@/lib/complaints';
import { fetchComplaintUpdates, requestComplaintReminder } from '@/services/complaintService';
import type { Complaint, ComplaintUpdate } from '@/types/complaint';

const REMINDER_COOLDOWN_MS = 24 * 60 * 60 * 1000;

interface ComplaintDetailModalProps {
  complaint: Complaint;
  canUpdate: boolean;
  canRemind: boolean;
  onChanged: () => Promise<void>;
  onClose: () => void;
}

function Fact({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-navy-700">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-navy-900">{value}</p>
      </div>
    </div>
  );
}

export function ComplaintDetailModal({ complaint, canUpdate, canRemind, onChanged, onClose }: ComplaintDetailModalProps) {
  const { notify } = useToast();
  const [updates, setUpdates] = useState<ComplaintUpdate[]>([]);
  const [loadingUpdates, setLoadingUpdates] = useState(true);
  const [updatesError, setUpdatesError] = useState(false);
  const [reminding, setReminding] = useState(false);

  const loadUpdates = useCallback(async () => {
    setLoadingUpdates(true);
    setUpdatesError(false);
    try {
      setUpdates(await fetchComplaintUpdates(complaint.id));
    } catch {
      setUpdatesError(true);
    } finally {
      setLoadingUpdates(false);
    }
  }, [complaint.id]);

  useEffect(() => {
    void loadUpdates();
  }, [loadUpdates, complaint.updated_at]);

  const delayed = isComplaintDelayed(complaint);
  const reminderSentRecently =
    complaint.last_reminded_at !== null &&
    Date.now() - new Date(complaint.last_reminded_at).getTime() < REMINDER_COOLDOWN_MS;
  const showReminder = canRemind && delayed;

  async function handleRemind() {
    setReminding(true);
    try {
      await requestComplaintReminder(complaint.id);
      notify('Reminder sent to the authority handling your complaint.', 'success');
      await onChanged();
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : 'We could not send the reminder.', 'error');
    } finally {
      setReminding(false);
    }
  }

  return (
    <Modal wide open title={complaint.issue_type} description={CATEGORY_LABELS[complaint.category]} onClose={onClose}>
      <div className="space-y-7">
        <div className="flex flex-wrap items-center gap-2">
          <ComplaintStatusBadge status={complaint.status} />
          {delayed && (
            <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">
              Delayed
            </span>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Fact icon={Tag} label="Category" value={CATEGORY_LABELS[complaint.category]} />
          <Fact icon={MapPin} label="Location" value={complaintLocation(complaint)} />
          <Fact icon={CalendarClock} label="Reported" value={formatComplaintDate(complaint.created_at)} />
          <Fact icon={Tag} label="Reported by" value={complaint.student_name} />
        </div>

        <section className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">Description</p>
          <p className="whitespace-pre-line break-words rounded-xl bg-navy-50/60 p-4 text-sm leading-relaxed text-navy-800">
            {complaint.description}
          </p>
        </section>

        {complaint.image_path && <ComplaintPhoto path={complaint.image_path} />}

        {showReminder && (
          <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-amber-900">
              {reminderSentRecently
                ? 'You sent a reminder recently. You can send another in 24 hours.'
                : 'This complaint has been open for over 48 hours. Send a reminder to the authority.'}
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleRemind}
              loading={reminding}
              disabled={reminderSentRecently}
            >
              <BellRing className="h-4 w-4" aria-hidden="true" />
              Send reminder
            </Button>
          </div>
        )}

        {canUpdate && complaint.status !== 'resolved' && (
          <StatusUpdateForm complaint={complaint} onUpdated={onChanged} />
        )}
        {canUpdate && complaint.status === 'resolved' && (
          <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
            This complaint is resolved. No further updates are needed.
          </p>
        )}

        <section className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">History</p>
          {loadingUpdates ? (
            <p className="text-sm text-navy-500">Loading history...</p>
          ) : updatesError ? (
            <div role="alert" className="flex flex-col gap-3 rounded-xl bg-rose-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-rose-800">We could not load the history.</p>
              <Button size="sm" variant="secondary" onClick={() => void loadUpdates()}>
                Retry
              </Button>
            </div>
          ) : (
            <ComplaintTimeline updates={updates} />
          )}
        </section>
      </div>
    </Modal>
  );
}
