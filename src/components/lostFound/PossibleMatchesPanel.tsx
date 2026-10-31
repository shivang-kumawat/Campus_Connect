import { CheckCircle2, Sparkles, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LostFoundPhoto } from '@/components/lostFound/LostFoundItemCard';
import { categoryLabel, formatItemDate, formatSimilarity } from '@/lib/lostFound';
import type { LostFoundItem, LostFoundMatch } from '@/types/lostFound';

interface PossibleMatchesPanelProps {
  matches: LostFoundMatch[];
  itemsById: Map<string, LostFoundItem>;
  ownedItemIds: string[];
  pendingMatchId: string | null;
  onRespond: (match: LostFoundMatch, decision: 'confirm' | 'dismiss') => void;
  onOpenItem: (item: LostFoundItem) => void;
}

export function PossibleMatchesPanel({
  matches,
  itemsById,
  ownedItemIds,
  pendingMatchId,
  onRespond,
  onOpenItem,
}: PossibleMatchesPanelProps) {
  const owned = new Set(ownedItemIds);
  const suggested = matches.filter((match) => match.status === 'suggested');

  if (suggested.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-navy-200 bg-white px-6 py-10 text-center">
        <Sparkles className="mx-auto h-6 w-6 text-sky-600" aria-hidden="true" />
        <p className="mt-3 text-sm font-semibold text-navy-900">No possible matches right now</p>
        <p className="mt-1 text-sm text-navy-600">
          When a report is similar enough to one from another student, it will appear here for you to review.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {suggested.map((match) => {
        const ownSideIsLost = owned.has(match.lost_item_id);
        const ownId = ownSideIsLost ? match.lost_item_id : match.found_item_id;
        const otherId = ownSideIsLost ? match.found_item_id : match.lost_item_id;
        const mine = itemsById.get(ownId);
        const other = itemsById.get(otherId);
        if (!mine || !other) return null;
        const busy = pendingMatchId === match.id;

        return (
          <article key={match.id} className="overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card">
            <div className="flex flex-col gap-3 border-b border-navy-100 bg-navy-50/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-navy-500">Actual similarity</p>
                <p className="text-2xl font-semibold tracking-tight text-navy-900">{formatSimilarity(match.score)}</p>
              </div>
              <p className="max-w-md text-xs text-navy-600">
                Based on name, description, location, category and date. Confirming does not mark either item as recovered.
              </p>
            </div>

            <div className="grid gap-px bg-navy-100 md:grid-cols-2">
              <MatchSide label="Your report" item={mine} onOpen={onOpenItem} />
              <MatchSide label="Possible match" item={other} onOpen={onOpenItem} />
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-navy-100 px-5 py-4 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => onRespond(match, 'dismiss')} disabled={busy}>
                <XCircle className="h-4 w-4" aria-hidden="true" />
                Not a match
              </Button>
              <Button onClick={() => onRespond(match, 'confirm')} loading={busy}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                Confirm match
              </Button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function MatchSide({ label, item, onOpen }: { label: string; item: LostFoundItem; onOpen: (item: LostFoundItem) => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(item);
        }
      }}
      className="flex cursor-pointer gap-4 bg-white p-5 transition hover:bg-sky-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-sky-100"
    >
      <LostFoundPhoto path={item.image_path} alt={item.name} className="h-24 w-24 shrink-0 rounded-xl" />
      <div className="min-w-0 space-y-1.5">
        <p className="text-xs font-medium uppercase tracking-wide text-sky-700">{label}</p>
        <p className="truncate text-sm font-semibold text-navy-900">{item.name}</p>
        <p className="text-xs text-navy-500">{categoryLabel(item.category)}</p>
        <p className="line-clamp-2 text-xs text-navy-600">{item.description}</p>
        <p className="text-xs text-navy-600">
          {item.location} · {formatItemDate(item.item_date)}
        </p>
      </div>
    </div>
  );
}
