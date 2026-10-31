import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, ClipboardCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ModuleCard, EmptyModule, StatCard } from '@/components/dashboard/DashboardCards';
import { ReviewStudentModal } from '@/components/warden/ReviewStudentModal';
import { StudentRecordList } from '@/components/warden/StudentRecordList';
import { useToast } from '@/hooks/useToast';
import { fetchHostelStudents, type ReviewDecision } from '@/services/wardenService';
import type { Profile, StudentVerificationRecord } from '@/types/profile';

interface ActiveReview {
  student: StudentVerificationRecord;
  decision: ReviewDecision;
}

export function WardenDashboard({ profile }: { profile: Profile }) {
  const { notify } = useToast();
  const [students, setStudents] = useState<StudentVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [activeReview, setActiveReview] = useState<ActiveReview | null>(null);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      setStudents(await fetchHostelStudents());
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = 'Hostel verification | CampusConnect';
    if (profile.hostel) void loadStudents();
    else setLoading(false);
  }, [profile.hostel, loadStudents]);

  const pending = students.filter((student) => student.verification_status === 'pending');
  const approved = students.filter((student) => student.verification_status === 'approved');
  const rejected = students.filter((student) => student.verification_status === 'rejected');
  const recentDecisions = [...approved, ...rejected]
    .sort((a, b) => (b.verified_at ?? '').localeCompare(a.verified_at ?? ''))
    .slice(0, 10);

  function handleReviewed(decision: ReviewDecision) {
    const name = activeReview?.student.full_name ?? 'Student';
    setActiveReview(null);
    notify(decision === 'approved' ? `${name} has been verified.` : `${name} has been rejected.`, 'success');
    void loadStudents();
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <div>
        <p className="text-sm font-medium text-sky-700">Hostel warden</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">
          {profile.hostel ? `${profile.hostel} verification` : 'Hostel verification'}
        </h1>
        <p className="mt-2 text-sm text-navy-600">
          Confirm that students who selected your hostel are allotted to it.
        </p>
      </div>

      {!profile.hostel ? (
        <EmptyModule message="No hostel is assigned to your account. Ask the Chief Warden to assign one." />
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-3">
            <StatCard icon={Clock} label="Awaiting review" value={String(pending.length)} hint="Students waiting for your decision" />
            <StatCard icon={CheckCircle2} label="Verified" value={String(approved.length)} hint="Students confirmed in your hostel" />
            <StatCard icon={XCircle} label="Not verified" value={String(rejected.length)} hint="Students who were rejected" />
          </div>

          {loadError && (
            <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-rose-800">We could not load students. Please try again.</p>
              <Button size="sm" variant="secondary" onClick={() => void loadStudents()}>
                Retry
              </Button>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <ModuleCard icon={ClipboardCheck} title="Pending verification">
              {loading ? (
                <p className="text-sm text-navy-500">Loading students...</p>
              ) : (
                <StudentRecordList
                  students={pending}
                  emptyMessage="No students are waiting for verification."
                  onReview={(student, decision) => setActiveReview({ student, decision })}
                />
              )}
            </ModuleCard>

            <ModuleCard icon={CheckCircle2} title="Recent decisions">
              {loading ? (
                <p className="text-sm text-navy-500">Loading students...</p>
              ) : (
                <StudentRecordList students={recentDecisions} emptyMessage="No decisions yet." />
              )}
            </ModuleCard>
          </div>
        </>
      )}

      {activeReview && (
        <ReviewStudentModal
          student={activeReview.student}
          decision={activeReview.decision}
          onClose={() => setActiveReview(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
}
