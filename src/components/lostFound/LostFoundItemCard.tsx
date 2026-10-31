import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ImageOff, MapPin } from 'lucide-react';
import { categoryLabel, formatItemDate } from '@/lib/lostFound';
import { getLostFoundImageUrl } from '@/services/lostFoundService';
import type { LostFoundItem } from '@/types/lostFound';
import { LOST_FOUND_REPORT_LABELS } from '@/config/lostFound';

interface LostFoundItemCardProps {
  item: LostFoundItem;
  isOwner: boolean;
  onOpen: (item: LostFoundItem) => void;
}

export function LostFoundPhoto({ path, alt, className }: { path: string | null; alt: string; className: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setUrl(null);
    setFailed(false);
    if (!path) return;
    getLostFoundImageUrl(path)
      .then((signed) => {
        if (!cancelled) setUrl(signed);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) {
    return (
      <div className={`flex items-center justify-center bg-navy-50 text-navy-300 ${className}`} aria-label="No photo">
        <ImageOff className="h-8 w-8" aria-hidden="true" />
      </div>
    );
  }
  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-navy-50 text-xs text-navy-500 ${className}`}>
        Photo unavailable
      </div>
    );
  }
  if (!url) {
    return <div className={`animate-pulse bg-navy-100 ${className}`} aria-label="Loading photo" />;
  }
  return <img src={url} alt={alt} className={`object-cover ${className}`} loading="lazy" />;
}

export function LostFoundItemCard({ item, isOwner, onOpen }: LostFoundItemCardProps) {
  const recovered = item.status === 'recovered';
  const isLost = item.report_type === 'lost';

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
      className="group flex w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white text-left shadow-card transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
    >
      <div className="relative h-40 w-full overflow-hidden">
        <LostFoundPhoto path={item.image_path} alt={item.name} className="h-full w-full transition duration-500 group-hover:scale-[1.03]" />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
            isLost ? 'bg-rose-600 text-white' : 'bg-sky-700 text-white'
          }`}
        >
          {LOST_FOUND_REPORT_LABELS[item.report_type]}
        </span>
        {recovered && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            Recovered
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-1 text-base font-semibold text-navy-900">{item.name}</h3>
          {isOwner && (
            <span className="shrink-0 rounded-full bg-navy-50 px-2 py-0.5 text-xs font-medium text-navy-700">Yours</span>
          )}
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-navy-500">{categoryLabel(item.category)}</p>
        <p className="line-clamp-2 text-sm text-navy-600">{item.description}</p>
        <div className="mt-auto space-y-1.5 pt-2 text-xs text-navy-600">
          <p className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-navy-400" aria-hidden="true" />
            <span className="truncate">{item.location}</span>
          </p>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5 shrink-0 text-navy-400" aria-hidden="true" />
            {formatItemDate(item.item_date)}
          </p>
        </div>
      </div>
    </div>
  );
}
