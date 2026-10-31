import { Link } from 'react-router-dom';
import { ArrowRight, BadgeCheck, Bell, Sparkles, Wrench } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-white pt-32 pb-20 sm:pt-36 lg:pb-28">
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[520px] w-[520px] rounded-full bg-sky-200/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-[-10%] h-[420px] w-[420px] rounded-full bg-navy-100/70 blur-3xl" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-navy-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
            Built for LNMIIT students and staff
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-[1.15] tracking-tight text-navy-900 sm:text-5xl lg:text-6xl">
            Making Campus Life <span className="text-sky-600">Smarter,</span> Together.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-600 sm:text-lg">
            CampusConnect brings hostel, internet and mess issues to the right authority in one click, and helps you
            find lost belongings with AI-assisted matching. Every request is tracked from submission to resolution.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Log in
              </Button>
            </Link>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-navy-600">
            <span className="flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              Verified student accounts
            </span>
            <span className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-sky-600" aria-hidden="true" />
              Real-time status alerts
            </span>
          </div>
        </div>

        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="relative overflow-hidden rounded-3xl border border-navy-100 bg-white p-3 shadow-lift">
            <img
              src="https://images.pexels.com/photos/5555112/pexels-photo-5555112.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Students walking together across a campus courtyard"
              className="h-80 w-full rounded-2xl object-cover sm:h-96"
            />
          </div>

          <div className="absolute -left-4 top-10 hidden w-64 animate-fade-up rounded-2xl border border-navy-100 bg-white p-4 shadow-lift sm:block [animation-delay:400ms]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-navy-500">
                <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
                Hostel complaint
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                Resolved
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-navy-900">Water supply restored in BH2</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-navy-50">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-sky-400 to-navy-700" />
            </div>
          </div>

          <div className="absolute -right-3 bottom-8 hidden w-60 animate-fade-up rounded-2xl border border-navy-100 bg-white p-4 shadow-lift sm:block [animation-delay:600ms]">
            <span className="flex items-center gap-2 text-xs font-semibold text-navy-500">
              <Sparkles className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
              Possible match found
            </span>
            <p className="mt-2 text-sm font-semibold text-navy-900">Black wallet near the library</p>
            <p className="mt-1 text-xs text-navy-500">Suggested for your review, you decide</p>
          </div>
        </div>
      </div>
    </section>
  );
}
