import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SelectField, TextField } from '@/components/ui/FormFields';
import { PortalCard, PortalShell } from '@/components/portal/PortalShell';
import { ForgotPasswordModal } from '@/components/login/ForgotPasswordModal';
import { QuickLinksPanel, type QuickLink } from '@/components/login/QuickLinksPanel';
import { ROLES, ROLE_LABELS, type Role } from '@/config/campus';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { signInWithPassword, signOutUser } from '@/services/authService';
import { fetchProfile } from '@/services/profileService';

const REMEMBERED_EMAIL_KEY = 'campusconnect.rememberedEmail';
const USER_TYPE_OPTIONS = ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] }));

interface FormErrors {
  email?: string;
  password?: string;
  form?: string;
}

function toLoginMessage(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Incorrect email or password.';
  if (/email not confirmed/i.test(message)) return 'Please verify your email before signing in.';
  if (/network|fetch/i.test(message)) return 'Network error. Check your connection and try again.';
  return 'We could not sign you in. Please try again.';
}

function readRememberedEmail() {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? '';
}

function writeRememberedEmail(email: string | null) {
  if (email) localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { notify } = useToast();
  const { setSignInInProgress } = useAuth();
  const [userType, setUserType] = useState<Role>('student');
  const [email, setEmail] = useState(readRememberedEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => readRememberedEmail() !== '');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    const nextErrors: FormErrors = {};
    if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) nextErrors.email = 'Enter a valid email address.';
    if (!password) nextErrors.password = 'Enter your password.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSignInInProgress(true);
    try {
      const user = await signInWithPassword(trimmedEmail, password);
      const profile = await fetchProfile(user.id);
      if (!profile) {
        await signOutUser();
        setErrors({ form: 'We could not find a CampusConnect profile for this account. Please contact support.' });
        return;
      }
      if (profile.role === userType) {
        notify('Welcome back to CampusConnect.', 'success');
      } else {
        notify(`Signed in as ${ROLE_LABELS[profile.role]}. Your account role decides what you can access.`, 'info');
      }
      writeRememberedEmail(rememberMe ? trimmedEmail : null);
      const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      setErrors({ form: toLoginMessage(error instanceof Error ? error.message : '') });
    } finally {
      setSubmitting(false);
      setSignInInProgress(false);
    }
  }

  function handleQuickLink(link: QuickLink) {
    if (link.id === 'report-issue') {
      navigate('/dashboard');
      return;
    }
    notify(`${link.label} is coming soon.`, 'info');
  }

  return (
    <PortalShell>
      <PortalCard aside={<QuickLinksPanel onSelect={handleQuickLink} />}>
        <h1 className="text-2xl font-semibold tracking-tight text-navy-900">Sign in</h1>
        <p className="mt-2 text-sm text-navy-600">Use your institute credentials to continue.</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
          {errors.form && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errors.form}
            </div>
          )}

          <SelectField
            label="User type"
            placeholder="Select user type"
            options={USER_TYPE_OPTIONS}
            value={userType}
            onChange={(event) => setUserType(event.target.value as Role)}
          />

          <TextField
            label="Institute email"
            type="email"
            autoComplete="email"
            placeholder="you@institute.edu"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={errors.email}
          />

          <div className="relative">
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={errors.password}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((visible) => !visible)}
              className="absolute right-2 top-[34px] rounded-lg p-1.5 text-navy-400 transition hover:bg-navy-50 hover:text-navy-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-navy-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-navy-300 text-navy-800 focus:ring-sky-200"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm font-semibold text-sky-700 underline-offset-4 transition hover:text-sky-800 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" size="lg" fullWidth loading={submitting}>
            Sign in
          </Button>
        </form>

        <p className="mt-8 text-center text-sm text-navy-600">
          New to CampusConnect?{' '}
          <Link to="/register" className="font-semibold text-navy-800 underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </PortalCard>

      {forgotOpen && <ForgotPasswordModal initialEmail={email} onClose={() => setForgotOpen(false)} />}
    </PortalShell>
  );
}
