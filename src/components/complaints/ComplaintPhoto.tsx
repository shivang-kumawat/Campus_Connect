import { useEffect, useState } from 'react';
import { ImageOff, Loader2 } from 'lucide-react';
import { getComplaintImageUrl } from '@/services/complaintService';

export function ComplaintPhoto({ path }: { path: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getComplaintImageUrl(path)
      .then((signedUrl) => {
        if (!cancelled) setUrl(signedUrl);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (failed) {
    return (
      <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl bg-navy-50 text-sm text-navy-600">
        <ImageOff className="h-6 w-6 text-navy-400" aria-hidden="true" />
        Photo could not be loaded.
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt="Photo attached to the complaint"
      className="max-h-80 w-full rounded-xl border border-navy-100 object-contain bg-navy-50"
    />
  );
}
