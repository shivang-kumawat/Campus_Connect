import { useCallback, useEffect, useState } from 'react';
import { listComplaints } from '@/services/complaintService';
import type { Complaint } from '@/types/complaint';

export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setComplaints(await listComplaints());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { complaints, loading, error, reload };
}
