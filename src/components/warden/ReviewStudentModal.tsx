import { useState, type FormEvent } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { TextAreaField } from '@/components/ui/FormFields';
import { reviewStudentHostel, type ReviewDecision } from '@/services/wardenService';
import type { StudentVerificationRecord } from '@/types/profile';

const MAX_REMARK_LENGTH = 500;

interface ReviewStudentModalProps {
  student: StudentVerificationRecord;
  decision: ReviewDecision;
  onClose: () => void;
  onReviewed: (decision: ReviewDecision) => void;
}

export function ReviewStudentModal({ student, decision, onClose, onReviewed }: ReviewStudentModalProps) {
  const [remark, setRemark] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [remarkError, setRemarkError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const approving = decision === 'approved';
  const trimmedRemark = remark.trim();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!approving && trimmedRemark.length === 0) {
      setRemarkError('Add a reason so the student knows what to fix.');
      return;
    }
    if (trimmedRemark.length > MAX_REMARK_LENGTH) {
      setRemarkError(`Keep the remark under ${MAX_REMARK_LENGTH} characters.`);
      return;
    }
    setRemarkError(undefined);

    setSaving(true);
    try {
      await reviewStudentHostel(student.id, decision, trimmedRemark);
      onReviewed(decision);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not save this decision. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      title={approving ? 'Verify student' : 'Reject verification'}
      description={`${student.full_name} (${student.hostel ?? 'no hostel'})`}
      onClose={saving ? () => undefined : onClose}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <p className="text-sm text-navy-600">
          {approving
            ? 'Confirm that this student is allotted to your hostel. The remark is optional.'
            : 'The student will see this reason on their profile and will need to contact the warden.'}
        </p>
        <TextAreaField
          label={approving ? 'Remark (optional)' : 'Reason for rejection'}
          value={remark}
          maxLength={MAX_REMARK_LENGTH}
          placeholder={approving ? 'For example: checked against the allotment list' : 'For example: hostel allotment not found'}
          onChange={(event) => setRemark(event.target.value)}
          error={remarkError}
          hint={`${remark.length}/${MAX_REMARK_LENGTH}`}
        />
        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant={approving ? 'primary' : 'danger'} loading={saving}>
            {approving ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <XCircle className="h-4 w-4" aria-hidden="true" />}
            {approving ? 'Verify student' : 'Reject student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
