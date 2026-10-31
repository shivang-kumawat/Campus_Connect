import { AlertTriangle, ChevronRight } from 'lucide-react';
import { CATEGORY_LABELS } from '@/config/complaints';
import { ComplaintStatusBadge } from '@/components/complaints/ComplaintStatusBadge';
import { complaintLocation, formatComplaintDate, isComplaintDelayed } from '@/lib/complaints';
import type { Complaint } from '@/types/complaint';

interface ComplaintListProps {
  complaints: Complaint[];
  emptyMessage: string;
  showStudent?: boolean;
  onSelect: (complaint: Complaint) => void;
}

export function ComplaintList({ complaints, emptyMessage, showStudent = false, onSelect }: ComplaintListProps) {
  if (complaints.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-5 py-8 text-center">
        <p className="text-sm font-medium text-navy-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-navy-100">
      {complaints.map((complaint) => {
        const delayed = isComplaintDelayed(complaint);
        return (
          <li key={complaint.id}>
            <button
              type="button"
              onClick={() => onSelect(complaint)}
              className="group flex w-full items-center gap-4 rounded-xl px-3 py-4 text-left transition duration-200 hover:bg-navy-50/70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-navy-900">{complaint.issue_type}</p>
                  <ComplaintStatusBadge status={complaint.status} />
                  {delayed && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-semibold text-rose-800">
                      <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                      Delayed
                    </span>
                  )}
                </div>
                <p className="text-xs text-navy-600">
                  {CATEGORY_LABELS[complaint.category]} · {complaintLocation(complaint)}
                  {showStudent && ` · ${complaint.student_name}`}
                </p>
                <p className="text-xs text-navy-500">Reported {formatComplaintDate(complaint.created_at)}</p>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-navy-300 transition group-hover:translate-x-0.5 group-hover:text-navy-600" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
