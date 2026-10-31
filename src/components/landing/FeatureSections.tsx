import { CheckCircle2, Clock3, MapPin, Search, Sparkles, Wrench, Wifi, UtensilsCrossed } from 'lucide-react';

const COMPLAINT_CATEGORIES = [
  { icon: Wrench, label: 'Hostel issues', detail: 'Water, electricity, rooms, cleanliness' },
  { icon: Wifi, label: 'Hostel internet', detail: 'Wi-Fi, speed, network login' },
  { icon: UtensilsCrossed, label: 'Mess and food', detail: 'Food quality, hygiene, serving' },
];

const MATCH_STEPS = [
  'Compares item names and descriptions using text similarity',
  'Weighs category, location and how close the dates are',
  'Suggests the closest matches with a similarity score',
];

export function FeatureSections() {
  return (
    <section id="features" className="scroll-mt-20 bg-white py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-600">Campus issue reporting</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-navy-900 sm:text-4xl">
              Report a problem once. Follow it until it is fixed.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-navy-600">
              Send complaints about your hostel, internet or mess straight to the responsible authority. Attach photos,
              track progress and see every remark and update in one timeline.
            </p>
            <ul className="mt-8 space-y-4">
              {COMPLAINT_CATEGORIES.map(({ icon: Icon, label, detail }) => (
                <li
                  key={label}
                  className="group flex items-center gap-4 rounded-2xl border border-navy-100 bg-navy-50/40 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-card"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-800 text-sky-200 transition group-hover:scale-105">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-navy-900">{label}</span>
                    <span className="block text-sm text-navy-600">{detail}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative rounded-3xl bg-gradient-to-br from-navy-900 to-navy-800 p-8 text-white shadow-lift sm:p-10">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-navy-100">Your complaint timeline</p>
              <span className="rounded-full bg-sky-400/20 px-3 py-1 text-xs font-semibold text-sky-200">In progress</span>
            </div>
            <ol className="mt-8 space-y-6 border-l border-navy-600 pl-6">
              <li className="relative">
                <span className="absolute -left-[31px] flex h-4 w-4 items-center justify-center rounded-full bg-emerald-400">
                  <CheckCircle2 className="h-3 w-3 text-navy-900" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">Submitted</p>
                <p className="text-xs text-navy-300">Routed to your hostel warden</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[31px] h-4 w-4 rounded-full bg-sky-300 ring-4 ring-sky-300/20" />
                <p className="text-sm font-semibold">Warden remark added</p>
                <p className="text-xs text-navy-300">Technician scheduled for tomorrow morning</p>
              </li>
              <li className="relative">
                <span className="absolute -left-[31px] h-4 w-4 rounded-full border-2 border-navy-500 bg-navy-900" />
                <p className="text-sm font-semibold text-navy-300">Resolved</p>
                <p className="text-xs text-navy-400">Awaiting confirmation</p>
              </li>
            </ol>
          </div>
        </div>

        <div className="mt-24 grid items-center gap-16 lg:grid-cols-2">
          <div className="order-2 rounded-3xl border border-navy-100 bg-gradient-to-b from-sky-50 to-white p-8 shadow-card sm:p-10 lg:order-1">
            <div className="flex items-center gap-3 rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
              <Search className="h-5 w-5 text-navy-400" aria-hidden="true" />
              <span className="text-sm text-navy-500">Black wallet, library, yesterday evening</span>
            </div>
            <div className="mt-5 space-y-4">
              <div className="rounded-2xl border border-sky-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-navy-900">Black leather wallet</p>
                  <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-navy-800">
                    Similarity 92%
                  </span>
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-navy-500">
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Near the library
                  <Clock3 className="ml-2 h-3.5 w-3.5" aria-hidden="true" /> Found 2 hours later
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-navy-500">
                <Sparkles className="h-3.5 w-3.5 text-sky-500" aria-hidden="true" />
                Suggestions only. You confirm every match yourself.
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-sm font-semibold uppercase tracking-wider text-sky-600">AI Lost &amp; Found</p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight tracking-tight text-navy-900 sm:text-4xl">
              Lost something? Our matching does the searching.
            </h2>
            <p className="mt-5 text-base leading-relaxed text-navy-600">
              Report lost or found items with a description, category, location and time. CampusConnect compares every
              report and surfaces likely matches, so you can review them and get in touch privately.
            </p>
            <ul className="mt-8 space-y-4">
              {MATCH_STEPS.map((step) => (
                <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-navy-700">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
