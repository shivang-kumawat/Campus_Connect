import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, PackageSearch, Plus, Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyModule, LoadErrorBanner, StatCard } from '@/components/dashboard/DashboardCards';
import { LostFoundFilterBar } from '@/components/lostFound/LostFoundFilterBar';
import { LostFoundItemCard } from '@/components/lostFound/LostFoundItemCard';
import { LostFoundItemModal } from '@/components/lostFound/LostFoundItemModal';
import { LostFoundReportModal } from '@/components/lostFound/LostFoundReportModal';
import { NotificationsPanel } from '@/components/lostFound/NotificationsPanel';
import { PossibleMatchesPanel } from '@/components/lostFound/PossibleMatchesPanel';
import { useLostFound } from '@/hooks/useLostFound';
import { EMPTY_LOST_FOUND_FILTERS, filterLostFoundItems, matchesInvolvingItems, type LostFoundFilters } from '@/lib/lostFound';
import { markNotificationRead, respondToLostFoundMatch } from '@/services/lostFoundService';
import type { Profile } from '@/types/profile';
import type { AppNotification, LostFoundItem, LostFoundMatch } from '@/types/lostFound';
import type { LostFoundReportType } from '@/config/lostFound';

type StudentTab = 'overview' | 'reports' | 'matches' | 'browse' | 'recovered' | 'notifications';

const TABS: { id: StudentTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'reports', label: 'My reports' },
  { id: 'matches', label: 'Possible matches' },
  { id: 'browse', label: 'Browse' },
  { id: 'recovered', label: 'Recovered' },
  { id: 'notifications', label: 'Notifications' },
];

const BROWSE_DEFAULT_FILTERS: LostFoundFilters = { ...EMPTY_LOST_FOUND_FILTERS, status: 'open' };

interface Feedback {
  tone: 'success' | 'error';
  message: string;
}

export function StudentLostFound({ profile }: { profile: Profile }) {
  const { items, ownedItemIds, matches, history, notifications, loading, error, reload } = useLostFound({
    includeOwned: true,
    includeNotifications: true,
  });
  const [tab, setTab] = useState<StudentTab>('overview');
  const [reportType, setReportType] = useState<LostFoundReportType | null>(null);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);
  const [browseFilters, setBrowseFilters] = useState<LostFoundFilters>(BROWSE_DEFAULT_FILTERS);
  const [pendingMatchId, setPendingMatchId] = useState<string | null>(null);
  const [pendingNotificationId, setPendingNotificationId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    document.title = 'Lost & Found | CampusConnect';
  }, []);

  const owned = useMemo(() => new Set(ownedItemIds), [ownedItemIds]);
  const itemsById = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const myItems = useMemo(() => items.filter((item) => owned.has(item.id)), [items, owned]);
  const myActive = myItems.filter((item) => item.status === 'open');
  const myRecovered = myItems.filter((item) => item.status === 'recovered');
  const mySuggested = useMemo(
    () => matchesInvolvingItems(matches, ownedItemIds).filter((match) => match.status === 'suggested'),
    [matches, ownedItemIds],
  );
  const unreadCount = notifications.filter((notification) => notification.read_at === null).length;
  const browseItems = useMemo(
    () => filterLostFoundItems(items, browseFilters),
    [items, browseFilters],
  );

  const openReport = (type: LostFoundReportType) => setReportType(type);

  const handleSaved = (type: LostFoundReportType) => {
    setFeedback({
      tone: 'success',
      message: `Your ${type} report is saved. We will notify you here if a possible match appears.`,
    });
    setTab('reports');
    void reload();
  };

  const handleRecovered = (message: string) => {
    setFeedback({ tone: 'success', message });
    void reload();
  };

  const handleRespond = async (match: LostFoundMatch, decision: 'confirm' | 'dismiss') => {
    setPendingMatchId(match.id);
    setFeedback(null);
    try {
      await respondToLostFoundMatch(match.id, decision);
      setFeedback({
        tone: 'success',
        message:
          decision === 'confirm'
            ? 'Match confirmed. The other student has been notified. Your item stays active until you mark it recovered.'
            : 'Match dismissed. It will no longer be suggested.',
      });
      await reload();
    } catch (err) {
      setFeedback({ tone: 'error', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setPendingMatchId(null);
    }
  };

  const handleMarkRead = async (notification: AppNotification) => {
    setPendingNotificationId(notification.id);
    try {
      await markNotificationRead(notification.id);
      await reload();
    } catch (err) {
      setFeedback({ tone: 'error', message: err instanceof Error ? err.message : 'Please try again.' });
    } finally {
      setPendingNotificationId(null);
    }
  };

  const itemCard = (item: LostFoundItem) => (
    <LostFoundItemCard key={item.id} item={item} isOwner={owned.has(item.id)} onOpen={setSelectedItem} />
  );

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Lost & Found</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
            Lost and found, {profile.full_name.split(' ')[0]}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-600">
            Report what you lost or found. Similar reports are compared automatically and suggested to you for review.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button variant="secondary" onClick={() => openReport('found')}>
            <Search className="h-4 w-4" aria-hidden="true" />
            Report found item
          </Button>
          <Button onClick={() => openReport('lost')}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Report lost item
          </Button>
        </div>
      </div>

      {feedback && (
        <p
          role={feedback.tone === 'error' ? 'alert' : 'status'}
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.tone === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
          }`}
        >
          {feedback.message}
        </p>
      )}

      {error ? (
        <LoadErrorBanner message="We could not load Lost & Found right now." onRetry={() => void reload()} />
      ) : loading ? (
        <p className="text-sm text-navy-500">Loading Lost & Found...</p>
      ) : (
        <>
          <nav aria-label="Lost and found sections" className="flex gap-2 overflow-x-auto border-b border-navy-100 pb-px">
            {TABS.map((item) => {
              const count =
                item.id === 'reports' ? myActive.length : item.id === 'matches' ? mySuggested.length : item.id === 'notifications' ? unreadCount : null;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`-mb-px inline-flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                    active ? 'border-sky-600 text-navy-900' : 'border-transparent text-navy-500 hover:text-navy-800'
                  }`}
                >
                  {item.label}
                  {count !== null && count > 0 && (
                    <span className="rounded-full bg-sky-600 px-2 py-0.5 text-xs font-semibold text-white">{count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          {tab === 'overview' && (
            <section className="space-y-8">
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon={PackageSearch} label="My reports" value={String(myItems.length)} hint="Lost and found reports you filed" />
                <StatCard icon={Sparkles} label="Active" value={String(myActive.length)} hint="Still waiting to be recovered" />
                <StatCard icon={Search} label="Possible matches" value={String(mySuggested.length)} hint="Waiting for your review" />
                <StatCard icon={CheckCircle2} label="Recovered" value={String(myRecovered.length)} hint="Marked as returned" />
              </div>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-navy-900">Latest reports</h2>
                  {myItems.length === 0 ? (
                    <EmptyModule message="You have not reported anything yet. Use the buttons above to get started." />
                  ) : (
                    <div className="grid gap-5 sm:grid-cols-2">{myItems.slice(0, 2).map(itemCard)}</div>
                  )}
                </div>
                <div className="space-y-4">
                  <h2 className="text-base font-semibold text-navy-900">Possible matches</h2>
                  <PossibleMatchesPanel
                    matches={mySuggested}
                    itemsById={itemsById}
                    ownedItemIds={ownedItemIds}
                    pendingMatchId={pendingMatchId}
                    onRespond={(match, decision) => void handleRespond(match, decision)}
                    onOpenItem={setSelectedItem}
                  />
                </div>
              </div>
            </section>
          )}

          {tab === 'reports' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Active reports</h2>
                <p className="mt-1 text-sm text-navy-600">Reports you filed that have not been marked recovered.</p>
              </div>
              {myActive.length === 0 ? (
                <EmptyModule message="No active reports. Recovered items are listed under Recovered." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{myActive.map(itemCard)}</div>
              )}
            </section>
          )}

          {tab === 'matches' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Possible matches</h2>
                <p className="mt-1 text-sm text-navy-600">
                  Matches are suggested by similarity, not confirmed. Review each one and confirm only if it is your item.
                </p>
              </div>
              <PossibleMatchesPanel
                matches={mySuggested}
                itemsById={itemsById}
                ownedItemIds={ownedItemIds}
                pendingMatchId={pendingMatchId}
                onRespond={(match, decision) => void handleRespond(match, decision)}
                onOpenItem={setSelectedItem}
              />
            </section>
          )}

          {tab === 'browse' && (
            <section className="space-y-5">
              <LostFoundFilterBar
                filters={browseFilters}
                onChange={setBrowseFilters}
                resultCount={browseItems.length}
              />
              {browseItems.length === 0 ? (
                <EmptyModule message="No reports match these filters. Try a broader search." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{browseItems.map(itemCard)}</div>
              )}
            </section>
          )}

          {tab === 'recovered' && (
            <section className="space-y-5">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Recovered items</h2>
                <p className="mt-1 text-sm text-navy-600">Items you marked as returned. Their history is kept.</p>
              </div>
              {myRecovered.length === 0 ? (
                <EmptyModule message="Nothing recovered yet." />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{myRecovered.map(itemCard)}</div>
              )}
            </section>
          )}

          {tab === 'notifications' && (
            <section className="space-y-5">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-navy-500" aria-hidden="true" />
                <h2 className="text-base font-semibold text-navy-900">Notifications</h2>
              </div>
              <NotificationsPanel
                notifications={notifications}
                pendingId={pendingNotificationId}
                onMarkRead={(notification) => void handleMarkRead(notification)}
              />
            </section>
          )}
        </>
      )}

      <LostFoundReportModal
        open={reportType !== null}
        reportType={reportType ?? 'lost'}
        studentId={profile.id}
        onClose={() => setReportType(null)}
        onSaved={handleSaved}
      />

      <LostFoundItemModal
        item={selectedItem}
        isOwner={selectedItem ? owned.has(selectedItem.id) : false}
        history={history}
        onClose={() => setSelectedItem(null)}
        onRecovered={handleRecovered}
      />
    </div>
  );
}
