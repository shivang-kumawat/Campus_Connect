import { Mail, Utensils } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VerificationBadge } from '@/components/verification/VerificationBadge';
import type { ReviewDecision } from '@/services/wardenService';
import type { StudentVerificationRecord } from '@/types/profile';

interface StudentRecordListProps {
  students: StudentVerificationRecord[];
  emptyMessage: string;
  onReview?: (student: StudentVerificationRecord, decision: ReviewDecision) => void;
}

function formatDate(value: string | null) {
  if (!value) return '';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function StudentRecordList({ students, emptyMessage, onReview }: StudentRecordListProps) {
  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-5 py-8 text-center">
        <p className="text-sm font-medium text-navy-700">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-navy-100">
      {students.map((student) => {
        const pending = student.verification_status === 'pending';
        return (
          <li key={student.id} className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-semibold text-navy-900">{student.full_name}</p>
                <VerificationBadge status={student.verification_status} />
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-navy-600">
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  {student.email}
                </span>
                {student.mess && (
                  <span className="inline-flex items-center gap-1.5">
                    <Utensils className="h-3.5 w-3.5" aria-hidden="true" />
                    {student.mess}
                  </span>
                )}
                {student.verified_at && <span>Reviewed {formatDate(student.verified_at)}</span>}
              </div>
              {student.verification_remark && (
                <p className="rounded-lg bg-navy-50 px-3 py-2 text-xs text-navy-700">Remark: {student.verification_remark}</p>
              )}
            </div>

            {pending && onReview && (
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="secondary" onClick={() => onReview(student, 'rejected')}>
                  Reject
                </Button>
                <Button size="sm" onClick={() => onReview(student, 'approved')}>
                  Verify
                </Button>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
