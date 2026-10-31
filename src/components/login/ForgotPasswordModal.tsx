import { useState, type FormEvent } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormFields';
import { Modal } from '@/components/ui/Modal';
import { sendPasswordReset } from '@/services/authService';

interface ForgotPasswordModalProps {
  initialEmail: string;
  onClose: () => void;
}

export function ForgotPasswordModal({ initialEmail, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return;
    }
    setEmailError(undefined);
    setFormError(null);
    setSubmitting(true);
    try {
      await sendPasswordReset(trimmed);
      setSentTo(trimmed);
    } catch {
      setFormError('We could not send the reset link. Check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Reset your password"
      description="Enter your institute email and we will send you a link to choose a new password."
    >
      {sentTo ? (
        <div className="space-y-6">
          <div role="status" className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
            <span>
              If an account exists for <span className="font-semibold">{sentTo}</span>, a reset link is on its way. Check
              your inbox and spam folder.
            </span>
          </div>
          <Button variant="secondary" fullWidth onClick={onClose}>
            Back to sign in
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {formError && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          )}
          <TextField
            label="Institute email"
            type="email"
            autoComplete="email"
            placeholder="you@institute.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={emailError}
            autoFocus
          />
          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button type="submit" fullWidth loading={submitting}>
              Send reset link
            </Button>
            <Button variant="secondary" fullWidth onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
