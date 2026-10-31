import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/FormFields';
import { FullPageLoader } from '@/components/ui/Skeleton';
import { MIN_PASSWORD_LENGTH } from '@/config/campus';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { updatePassword } from '@/services/authService';

interface FormErrors {
  password?: string;
  confirm?: string;
  form?: string;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const { session, loading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  if (loading) return <FullPageLoader />;

  if (!session) {
    return (
      <div className="animate-fade-up">
        <h1 className="text-3xl font-semibold tracking-tight text-navy-900">This link has expired</h1>
        <p className="mt-2 text-sm leading-relaxed text-navy-600">
          Password reset links can only be used once and expire after a short time. Request a new link from the sign-in
          page.
        </p>
        <p className="mt-8 text-center text-sm text-navy-600">
          <Link to="/login" className="font-semibold text-navy-800 underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: FormErrors = {};
    if (password.length < MIN_PASSWORD_LENGTH) {
      nextErrors.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (confirm !== password) nextErrors.confirm = 'Passwords do not match.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      await updatePassword(password);
      notify('Your password has been updated.', 'success');
      navigate('/dashboard', { replace: true });
    } catch {
      setErrors({ form: 'We could not update your password. Request a new link and try again.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="animate-fade-up">
      <h1 className="text-3xl font-semibold tracking-tight text-navy-900">Choose a new password</h1>
      <p className="mt-2 text-sm text-navy-600">Set a new password for your CampusConnect account.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        {errors.form && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {errors.form}
          </div>
        )}
        <TextField
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={errors.password}
        />
        <TextField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your new password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          error={errors.confirm}
        />
        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Update password
        </Button>
      </form>
    </div>
  );
}
