import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LogoProps {
  to?: string;
  tone?: 'light' | 'dark';
}

export function Logo({ to = '/', tone = 'dark' }: LogoProps) {
  const textClass = tone === 'light' ? 'text-white' : 'text-navy-900';
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-navy-700 to-navy-900 text-sky-200 shadow-sm transition duration-300 group-hover:rotate-[-6deg] group-hover:scale-105">
        <GraduationCap className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className={`text-lg font-semibold tracking-tight ${textClass}`}>CampusConnect</span>
    </Link>
  );
}
