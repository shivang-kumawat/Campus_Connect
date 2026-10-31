import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField, TextAreaField } from '@/components/ui/FormFields';
import {
  CATEGORY_LABELS,
  COMPLAINT_CATEGORIES,
  COMPLAINT_DESCRIPTION_LIMITS,
  ISSUE_TYPES,
  type ComplaintCategory,
} from '@/config/complaints';
import { createComplaint, validateComplaintImage } from '@/services/complaintService';
import { useToast } from '@/hooks/useToast';
import type { Profile } from '@/types/profile';

interface ReportComplaintModalProps {
  profile: Profile;
  onClose: () => void;
  onCreated: () => Promise<void>;
}

const CATEGORY_OPTIONS = COMPLAINT_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] }));

export function ReportComplaintModal({ profile, onClose, onCreated }: ReportComplaintModalProps) {
  const { notify } = useToast();
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<ComplaintCategory | ''>('');
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ category?: string; issueType?: string; description?: string; image?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  const issueOptions = category ? ISSUE_TYPES[category] : [];
  const location = category === 'mess_issue' ? profile.mess : profile.hostel;

  function handleCategoryChange(value: string) {
    setCategory(value as ComplaintCategory | '');
    setIssueType('');
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setImage(null);
      return;
    }
    const problem = validateComplaintImage(file);
    if (problem) {
      setImage(null);
      event.target.value = '';
      setErrors((current) => ({ ...current, image: problem }));
      return;
    }
    setErrors((current) => ({ ...current, image: undefined }));
    setImage(file);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    const nextErrors: typeof errors = {};
    if (!category) nextErrors.category = 'Choose a category.';
    if (category && !issueType) nextErrors.issueType = 'Choose the issue.';
    const trimmed = description.trim();
    if (trimmed.length < COMPLAINT_DESCRIPTION_LIMITS.min) {
      nextErrors.description = `Describe the problem in at least ${COMPLAINT_DESCRIPTION_LIMITS.min} characters.`;
    } else if (trimmed.length > COMPLAINT_DESCRIPTION_LIMITS.max) {
      nextErrors.description = `Keep the description under ${COMPLAINT_DESCRIPTION_LIMITS.max} characters.`;
    }
    setErrors((current) => ({ category: nextErrors.category, issueType: nextErrors.issueType, description: nextErrors.description, image: current.image }));
    if (errors.image || Object.keys(nextErrors).length > 0 || !category) return;

    setSaving(true);
    try {
      await createComplaint({
        studentId: profile.id,
        category,
        issueType,
        description,
        image,
      });
      notify('Your complaint has been submitted.', 'success');
      await onCreated();
    } catch (cause) {
      setFormError(cause instanceof Error ? cause.message : 'We could not submit your complaint. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal wide open title="Report a campus issue" description="Tell the right authority what is wrong." onClose={saving ? () => undefined : onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField
            label="Category"
            options={CATEGORY_OPTIONS}
            placeholder="Select category"
            value={category}
            onChange={(event) => handleCategoryChange(event.target.value)}
            error={errors.category}
          />
          <SelectField
            label="Issue"
            options={issueOptions.map((value) => ({ value, label: value }))}
            placeholder={category ? 'Select issue' : 'Choose a category first'}
            value={issueType}
            onChange={(event) => setIssueType(event.target.value)}
            disabled={!category}
            error={errors.issueType}
          />
        </div>

        <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-navy-700">
          This complaint will be sent for {location ?? 'your hostel or mess'}, taken from your profile.
        </p>

        <TextAreaField
          label="Description"
          value={description}
          maxLength={COMPLAINT_DESCRIPTION_LIMITS.max}
          placeholder="Describe what is happening, where, and since when."
          onChange={(event) => setDescription(event.target.value)}
          error={errors.description}
          hint={`${description.length}/${COMPLAINT_DESCRIPTION_LIMITS.max}`}
        />

        <div className="space-y-2">
          <label htmlFor={fileInputId} className="block text-sm font-medium text-navy-800">
            Photo <span className="font-normal text-navy-500">(optional)</span>
          </label>
          {previewUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-navy-100 bg-navy-50">
              <img src={previewUrl} alt="Selected complaint photo" className="max-h-56 w-full object-contain" />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-navy-700 shadow-sm transition hover:bg-white"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={fileInputId}
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-navy-200 bg-navy-50/40 px-5 py-8 text-center transition hover:border-sky-400 hover:bg-sky-50/50"
            >
              <ImagePlus className="h-6 w-6 text-navy-500" aria-hidden="true" />
              <span className="text-sm font-medium text-navy-700">Choose a photo</span>
              <span className="text-xs text-navy-500">JPEG, PNG or WebP, up to 5 MB</span>
            </label>
          )}
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="sr-only"
          />
          {errors.image && (
            <p role="alert" className="text-xs font-medium text-rose-600">
              {errors.image}
            </p>
          )}
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Submit complaint
          </Button>
        </div>
      </form>
    </Modal>
  );
}
