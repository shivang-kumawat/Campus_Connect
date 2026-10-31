import { Link } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

export function LandingFooter() {
  return (
    <footer className="border-t border-navy-100 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-5 py-12 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Logo />
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-navy-600">
            A smart campus platform for issue reporting and Lost &amp; Found, built for the LNMIIT community.
          </p>
        </div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm font-medium text-navy-600" aria-label="Footer">
          <a href="#features" className="transition hover:text-navy-900">
            Features
          </a>
          <a href="#how-it-works" className="transition hover:text-navy-900">
            How it works
          </a>
          <a href="#benefits" className="transition hover:text-navy-900">
            Benefits
          </a>
          <Link to="/login" className="transition hover:text-navy-900">
            Log in
          </Link>
          <Link to="/register" className="transition hover:text-navy-900">
            Get started
          </Link>
        </nav>
      </div>
      <div className="border-t border-navy-100">
        <p className="mx-auto max-w-7xl px-5 py-6 text-xs text-navy-500 sm:px-8">
          &copy; {new Date().getFullYear()} CampusConnect. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
