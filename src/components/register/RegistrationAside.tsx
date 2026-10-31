import { CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const BENEFITS = [
  'Report hostel, internet and mess issues and track every update',
  'AI-assisted Lost & Found matching that suggests, never decides',
  'Instant in-app alerts for status changes and authority remarks',
];

export function RegistrationAside() {
  return (
    <aside className="flex flex-col bg-gradient-to-br from-sky-700 via-navy-800 to-navy-900 p-8 text-white md:p-10">
      <div className="animate-fade-up">
        <h2 className="text-2xl font-semibold leading-tight">Join CampusConnect</h2>
        <p className="mt-2 text-sm leading-relaxed text-sky-100">
          Create your student account to report issues and follow every update in one place.
        </p>
      </div>

      <p className="mt-10 text-xs font-semibold uppercase tracking-wider text-sky-200">What you get</p>
      <ul className="mt-3 space-y-4">
        {BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3 text-sm leading-relaxed text-sky-50">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
            {benefit}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-10">
        <p className="text-sm text-sky-100">Already registered?</p>
        <Link
          to="/login"
          className="mt-3 inline-flex h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Sign in to CampusConnect
        </Link>
      </div>
    </aside>
  );
}
