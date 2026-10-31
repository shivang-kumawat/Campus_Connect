import { Outlet } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';

const HIGHLIGHTS = [
  'Report hostel, internet and mess issues and track every update',
  'AI-assisted Lost & Found matching that suggests, never decides',
  'Instant in-app alerts for status changes and authority remarks',
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-navy-900 lg:flex">
        <img
          src="https://images.pexels.com/photos/7973029/pexels-photo-7973029.jpeg?auto=compress&cs=tinysrgb&h=1200&w=1200"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy-950 via-navy-900/90 to-navy-700/70" />
        <div className="relative flex w-full flex-col justify-between p-12 xl:p-16">
          <Logo tone="light" />
          <div className="max-w-md animate-fade-up">
            <h2 className="text-3xl font-semibold leading-tight text-white xl:text-4xl">
              One place for everything that makes campus work.
            </h2>
            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed text-navy-100">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-sky-300" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </aside>

      <main className="flex items-center justify-center bg-white px-6 py-12 sm:px-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
