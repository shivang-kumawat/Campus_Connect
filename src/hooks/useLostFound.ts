import { useCallback, useEffect, useState } from 'react';
import {
  listLostFoundHistory,
  listLostFoundItems,
  listLostFoundMatches,
  listNotifications,
  listOwnedItemIds,
} from '@/services/lostFoundService';
import type {
  AppNotification,
  LostFoundHistoryEntry,
  LostFoundItem,
  LostFoundMatch,
} from '@/types/lostFound';

export interface LostFoundData {
  items: LostFoundItem[];
  ownedItemIds: string[];
  matches: LostFoundMatch[];
  history: LostFoundHistoryEntry[];
  notifications: AppNotification[];
}

const EMPTY_DATA: LostFoundData = {
  items: [],
  ownedItemIds: [],
  matches: [],
  history: [],
  notifications: [],
};

export function useLostFound(options: { includeNotifications: boolean; includeOwned: boolean }) {
  const { includeNotifications, includeOwned } = options;
  const [data, setData] = useState<LostFoundData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [items, matches, history, ownedItemIds, notifications] = await Promise.all([
        listLostFoundItems(),
        listLostFoundMatches(),
        listLostFoundHistory(),
        includeOwned ? listOwnedItemIds() : Promise.resolve([]),
        includeNotifications ? listNotifications() : Promise.resolve([]),
      ]);
      setData({ items, matches, history, ownedItemIds, notifications });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [includeNotifications, includeOwned]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { ...data, loading, error, reload };
}
