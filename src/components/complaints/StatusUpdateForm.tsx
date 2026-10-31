import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { SelectField, TextAreaField } from '@/components/ui/FormFields';
import { COMPLAINT_STATUSES, REMARK_MAX_LENGTH, STATUS_LABELS, type ComplaintStatus } from '@/config/complaints';
import { updateComplaintStatus } from '@/services/complaintService';
import type { Complaint } from '@/types/complaint';

interface StatusUpdateFormProps {
  complaint: Complaint;
  onUpdated: () => Promise<void>;
}

export function StatusUpdateForm({ complaint, onUpdated }: StatusUpdateFormProps) {
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const statusOptions = COMPLAINT_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (!status) {
      setError('Choose a status.');
      return;
    }
    if (status === complaint.status && remark.trim() === '') {
      setError('Choose a different status or add a remark.');
      return;
    }
    if (remark.trim().length > REMARK_MAX_LENGTH) {
      setError(`Keep the remark under ${REMARK_MAX_LENGTH} characters.`);
      return;
    }

    setSaving(true);
    try {
      await updateComplaintStatus(complaint.id, status, remark);
      setStatus('');
      setRemark('');
      await onUpdated();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not save this update. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 rounded-2xl border border-navy-100 bg-navy-50/50 p-5">
      <p className="text-sm font-semibold text-navy-900">Update this complaint</p>
      <SelectField
        label="New status"
        options={statusOptions}
        placeholder="Select status"
        value={status}
        onChange={(event) => setStatus(event.target.value as ComplaintStatus | '')}
      />
      <TextAreaField
        label="Remark for the student"
        value={remark}
        maxLength={REMARK_MAX_LENGTH}
        placeholder="For example: Electrician has been called and will visit today."
        onChange={(event) => setRemark(event.target.value)}
        hint={`${remark.length}/${REMARK_MAX_LENGTH}`}
      />
      {error && (
        <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" loading={saving}>
          Save update
        </Button>
      </div>
    </form>
  );
}
