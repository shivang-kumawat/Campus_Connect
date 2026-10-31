import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormFields';
import { PortalCard, PortalShell } from '@/components/portal/PortalShell';
import { RegistrationAside } from '@/components/register/RegistrationAside';
import { HOSTELS, MESSES, MIN_PASSWORD_LENGTH, type Hostel, type Mess } from '@/config/campus';
import { useToast } from '@/hooks/useToast';
import { signUpStudent } from '@/services/authService';
import { fetchAllowedEmailDomains } from '@/services/profileService';
import type { AllowedEmailDomain } from '@/types/profile';

interface RegisterForm {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  hostel: string;
  mess: string;
}

type FormErrors = Partial<Record<keyof RegisterForm | 'form', string>>;

const EMPTY_FORM: RegisterForm = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  hostel: '',
  mess: '',
};

function toRegisterMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const code = (error as { code?: string } | null)?.code ?? '';
  if (code === 'user_already_exists' || /already registered|already exists/i.test(message)) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (code === 'weak_password') return `Password is too weak: ${message}`;
  if (code === 'email_address_invalid') return 'The sign-up service rejected this email address. Check the spelling.';
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit') {
    return 'Too many sign-up attempts. Wait a few minutes and try again.';
  }
  if (code === 'signup_disabled') return 'Student sign-up is currently turned off. Contact the IT department.';
  if (/not allowed to register|domain/i.test(message)) {
    return 'This email domain is not allowed to register on CampusConnect.';
  }
  if (/database error/i.test(message)) {
    return 'Your account could not be saved to the CampusConnect database. Contact the IT department with this time and email address.';
  }
  if (/network|fetch|failed to fetch/i.test(message)) return 'Network error. Check your connection and try again.';
  if (message) return `Registration failed: ${message}`;
  return 'We could not create your account. Please try again.';
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { notify } = useToast();
  const [form, setForm] = useState<RegisterForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [domains, setDomains] = useState<AllowedEmailDomain[] | null>(null);
  const [domainsError, setDomainsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    document.title = 'Create account | CampusConnect';
    fetchAllowedEmailDomains()
      .then(setDomains)
      .catch(() => setDomainsError(true));
  }, []);

  function update<K extends keyof RegisterForm>(key: K, value: RegisterForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined, form: undefined }));
  }

  function validate(values: RegisterForm, allowed: AllowedEmailDomain[]): FormErrors {
    const next: FormErrors = {};
    const fullName = values.fullName.trim();
    if (fullName.length < 2) next.fullName = 'Enter your full name (at least 2 characters).';

    const email = values.email.trim().toLowerCase();
    const emailMatch = /^[^\s@]+@([^\s@]+)$/.exec(email);
    if (!emailMatch) {
      next.email = 'Enter a valid institute email address.';
    } else if (!allowed.some((entry) => entry.domain === emailMatch[1])) {
      next.email = 'This email domain is not accepted for student registration.';
    }

    if (values.password.length < MIN_PASSWORD_LENGTH) {
      next.password = `Use at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    if (values.confirmPassword !== values.password) {
      next.confirmPassword = 'Passwords do not match.';
    }
    if (!values.hostel) next.hostel = 'Select your hostel.';
    if (!values.mess) next.mess = 'Select your mess.';
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!domains) return;
    if (domains.length === 0) {
      setErrors({ form: 'Student registration is not open yet. Please check back later.' });
      return;
    }
    const nextErrors = validate(form, domains);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const result = await signUpStudent({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        hostel: form.hostel as Hostel,
        mess: form.mess as Mess,
      });
      if (result.session) {
        notify('Your account is ready. Welcome to CampusConnect!', 'success');
        navigate('/dashboard', { replace: true });
      } else {
        setConfirmationSent(true);
      }
    } catch (error) {
      setErrors({ form: toRegisterMessage(error) });
    } finally {
      setSubmitting(false);
    }
  }

  const domainHint =
    domains === null
      ? 'Loading accepted email domains...'
      : domains.length === 0
        ? 'No email domains are configured yet.'
        : `Accepted domains: ${domains.map((entry) => `@${entry.domain}`).join(', ')}`;

  return (
    <PortalShell>
      <PortalCard aside={<RegistrationAside />}>
        {confirmationSent ? (
          <div className="animate-fade-up text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight text-navy-900">Account created</h1>
            <p className="mt-2 text-sm text-navy-600">You can now sign in with your email and password.</p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-12 items-center justify-center rounded-xl bg-navy-800 px-6 text-base font-semibold text-white shadow-sm transition duration-200 hover:bg-navy-900 hover:shadow-lift"
            >
              Go to sign in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Create your student account</h1>
            <p className="mt-2 text-sm text-navy-600">Your hostel and mess help route complaints to the right people.</p>

            {domainsError && (
              <div role="alert" className="mt-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                We could not load the accepted email domains. Refresh the page to try again.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
              {errors.form && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {errors.form}
                </div>
              )}

              <TextField
                label="Full name"
                autoComplete="name"
                placeholder="Aarav Sharma"
                value={form.fullName}
                onChange={(event) => update('fullName', event.target.value)}
                error={errors.fullName}
              />
              <TextField
                label="Institute email"
                type="email"
                autoComplete="email"
                placeholder="you@institute.edu"
                value={form.email}
                onChange={(event) => update('email', event.target.value)}
                error={errors.email}
                hint={domainHint}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <TextField
                  label="Password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(event) => update('password', event.target.value)}
                  error={errors.password}
                />
                <TextField
                  label="Confirm password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repeat password"
                  value={form.confirmPassword}
                  onChange={(event) => update('confirmPassword', event.target.value)}
                  error={errors.confirmPassword}
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <SelectField
                  label="Hostel"
                  options={HOSTELS}
                  placeholder="Select hostel"
                  value={form.hostel}
                  onChange={(event) => update('hostel', event.target.value)}
                  error={errors.hostel}
                />
                <SelectField
                  label="Mess"
                  options={MESSES}
                  placeholder="Select mess"
                  value={form.mess}
                  onChange={(event) => update('mess', event.target.value)}
                  error={errors.mess}
                />
              </div>

              <Button type="submit" size="lg" fullWidth loading={submitting} disabled={domains === null}>
                Create account
              </Button>
            </form>

            <p className="mt-8 text-center text-sm text-navy-600">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-navy-800 underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}
      </PortalCard>
    </PortalShell>
  );
}
