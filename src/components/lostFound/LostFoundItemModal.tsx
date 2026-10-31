import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { LostFoundPhoto } from '@/components/lostFound/LostFoundItemCard';
import {
  categoryLabel,
  formatApproxTime,
  formatItemDate,
  formatTimestamp,
} from '@/lib/lostFound';
import { markLostFoundItemRecovered } from '@/services/lostFoundService';
import { LOST_FOUND_REPORT_LABELS, LOST_FOUND_STATUS_LABELS } from '@/config/lostFound';
import type { LostFoundHistoryEntry, LostFoundItem } from '@/types/lostFound';

const HISTORY_LABELS: Record<LostFoundHistoryEntry['kind'], string> = {
  created: 'Report filed',
  match_suggested: 'Possible match suggested',
  match_confirmed: 'Match confirmed',
  match_dismissed: 'Match dismissed',
  recovered: 'Marked as recovered',
};

interface LostFoundItemModalProps {
  item: LostFoundItem | null;
  isOwner: boolean;
  history: LostFoundHistoryEntry[];
  onClose: () => void;
  onRecovered: (message: string) => void;
}

export function LostFoundItemModal({ item, isOwner, history, onClose, onRecovered }: LostFoundItemModalProps) {
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setConfirming(false);
    setError(null);
    onClose();
  };

  const recover = async () => {
    if (!item) return;
    setSubmitting(true);
    setError(null);
    try {
      await markLostFoundItemRecovered(item.id);
      setConfirming(false);
      onRecovered(`"${item.name}" is now marked as recovered and removed from active listings.`);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not mark this item recovered. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const timeline = item ? history.filter((entry) => entry.item_id === item.id) : [];
  const approxTime = item ? formatApproxTime(item.approx_time) : null;
  const canRecover = Boolean(item && isOwner && item.status === 'open');

  return (
    <Modal open={item !== null} title={item?.name ?? ''} description={item ? `${LOST_FOUND_REPORT_LABELS[item.report_type]} item` : undefined} wide onClose={close}>
      {item && (
        <div className="space-y-6">
          <LostFoundPhoto path={item.image_path} alt={item.name} className="h-56 w-full rounded-2xl" />

          <dl className="grid gap-4 sm:grid-cols-2">
            <Detail label="Category" value={categoryLabel(item.category)} />
            <Detail label="Status" value={LOST_FOUND_STATUS_LABELS[item.status]} />
            <Detail label="Location" value={item.location} />
            <Detail
              label={item.report_type === 'lost' ? 'Date lost' : 'Date found'}
              value={`${formatItemDate(item.item_date)}${approxTime ? `, around ${approxTime}` : ''}`}
            />
            <Detail label="Reported" value={formatTimestamp(item.created_at)} />
            {item.recovered_at && <Detail label="Recovered on" value={formatTimestamp(item.recovered_at)} />}
          </dl>

          <div>
            <p className="text-sm font-semibold text-navy-900">Description</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-navy-700">{item.description}</p>
          </div>

          <div>
            <p className="text-sm font-semibold text-navy-900">History</p>
            <ol className="mt-3 space-y-3 border-l border-navy-100 pl-5">
              {timeline.map((entry) => (
                <li key={entry.id} className="relative">
                  <span className="absolute -left-[1.45rem] top-1.5 h-2 w-2 rounded-full bg-sky-600" aria-hidden="true" />
                  <p className="text-sm font-medium text-navy-800">{HISTORY_LABELS[entry.kind]}</p>
                  <p className="text-xs text-navy-500">{formatTimestamp(entry.created_at)}</p>
                </li>
              ))}
            </ol>
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
              {error}
            </p>
          )}

          {canRecover && (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
              {confirming ? (
                <div className="space-y-4">
                  <p className="text-sm text-navy-800">
                    Mark this item as recovered? It will leave active listings and stop being matched. Its history will be kept.
                  </p>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <Button variant="secondary" onClick={() => setConfirming(false)} disabled={submitting}>
                      Not yet
                    </Button>
                    <Button onClick={() => void recover()} loading={submitting}>
                      Yes, mark recovered
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">Got your item back?</p>
                    <p className="mt-1 text-sm text-navy-600">Mark it as recovered to remove it from active listings.</p>
                  </div>
                  <Button variant="secondary" onClick={() => setConfirming(true)} className="shrink-0">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Mark as recovered
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-navy-50/60 px-4 py-3">
      <dt className="text-xs font-medium uppercase tracking-wide text-navy-500">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-navy-900">{value}</dd>
    </div>
  );
}
