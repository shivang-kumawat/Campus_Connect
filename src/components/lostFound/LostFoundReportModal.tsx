import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ImagePlus, X } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SelectField, TextAreaField, TextField } from '@/components/ui/FormFields';
import {
  LOST_FOUND_CATEGORIES,
  LOST_FOUND_CATEGORY_LABELS,
  LOST_FOUND_DESCRIPTION_LENGTH,
  LOST_FOUND_LOCATION_LENGTH,
  LOST_FOUND_NAME_LENGTH,
  LOST_FOUND_REPORT_LABELS,
  type LostFoundCategory,
  type LostFoundReportType,
} from '@/config/lostFound';
import { createLostFoundReport, validateLostFoundReport } from '@/services/lostFoundService';

interface LostFoundReportModalProps {
  open: boolean;
  reportType: LostFoundReportType;
  studentId: string;
  onClose: () => void;
  onSaved: (reportType: LostFoundReportType) => void;
}

interface FormState {
  name: string;
  category: string;
  description: string;
  location: string;
  itemDate: string;
  approxTime: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  category: '',
  description: '',
  location: '',
  itemDate: '',
  approxTime: '',
};

const CATEGORY_OPTIONS = LOST_FOUND_CATEGORIES.map((value) => ({
  value,
  label: LOST_FOUND_CATEGORY_LABELS[value],
}));

export function LostFoundReportModal({ open, reportType, studentId, onClose, onSaved }: LostFoundReportModalProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [image, setImage] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);

  const previewUrl = useMemo(() => (image ? URL.createObjectURL(image) : null), [image]);
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setImage(null);
      setFormError(null);
    }
  }, [open, reportType]);

  const label = LOST_FOUND_REPORT_LABELS[reportType];
  const dateLabel = reportType === 'lost' ? 'Date you lost it' : 'Date you found it';
  const locationLabel = reportType === 'lost' ? 'Where did you lose it?' : 'Where did you find it?';

  const update = (field: keyof FormState) => (event: { target: { value: string } }) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const input = {
      studentId,
      reportType,
      name: form.name,
      category: form.category as LostFoundCategory,
      description: form.description,
      location: form.location,
      itemDate: form.itemDate,
      approxTime: form.approxTime,
      image,
    };
    const validationError = validateLostFoundReport(input);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setSubmitting(true);
    try {
      await createLostFoundReport(input);
      onSaved(reportType);
      onClose();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'We could not save your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={`Report a ${label.toLowerCase()} item`}
      description="Share as much detail as you can so the matching system can find a likely match."
      wide
      onClose={onClose}
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label="Item name"
            name="name"
            maxLength={LOST_FOUND_NAME_LENGTH.max}
            placeholder="e.g. Black leather wallet"
            value={form.name}
            onChange={update('name')}
          />
          <SelectField
            label="Category"
            name="category"
            options={CATEGORY_OPTIONS}
            placeholder="Choose a category"
            value={form.category}
            onChange={update('category')}
          />
        </div>

        <TextAreaField
          label="Description"
          name="description"
          maxLength={LOST_FOUND_DESCRIPTION_LENGTH.max}
          placeholder="Colour, brand, markings, contents or anything that makes it unique"
          value={form.description}
          onChange={update('description')}
        />

        <TextField
          label={locationLabel}
          name="location"
          maxLength={LOST_FOUND_LOCATION_LENGTH.max}
          placeholder="e.g. Library ground floor"
          value={form.location}
          onChange={update('location')}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <TextField
            label={dateLabel}
            name="itemDate"
            type="date"
            max={today}
            value={form.itemDate}
            onChange={update('itemDate')}
          />
          <TextField
            label="Approximate time (optional)"
            name="approxTime"
            type="time"
            value={form.approxTime}
            onChange={update('approxTime')}
          />
        </div>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-navy-800">Photo (optional)</p>
          {previewUrl ? (
            <div className="flex items-center gap-4 rounded-2xl border border-navy-100 bg-navy-50/60 p-3">
              <img src={previewUrl} alt="Selected item preview" className="h-20 w-20 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-navy-800">{image?.name}</p>
                <p className="text-xs text-navy-500">JPEG, PNG or WebP, up to 5 MB</p>
              </div>
              <button
                type="button"
                onClick={() => setImage(null)}
                className="rounded-lg p-2 text-navy-500 transition hover:bg-white hover:text-navy-800"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-navy-200 bg-white px-4 py-6 text-center transition hover:border-sky-400 hover:bg-sky-50/40">
              <ImagePlus className="h-6 w-6 text-navy-500" aria-hidden="true" />
              <span className="text-sm font-medium text-navy-800">Add a photo</span>
              <span className="text-xs text-navy-500">JPEG, PNG or WebP, up to 5 MB</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(event) => {
                  setImage(event.target.files?.[0] ?? null);
                  setFormError(null);
                }}
              />
            </label>
          )}
        </div>

        {formError && (
          <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {formError}
          </p>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            Submit {label.toLowerCase()} report
          </Button>
        </div>
      </form>
    </Modal>
  );
}
