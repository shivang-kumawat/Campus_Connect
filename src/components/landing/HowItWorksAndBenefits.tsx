import { ClipboardList, Lock, Send, ShieldCheck, Zap } from 'lucide-react';

const STEPS = [
  {
    icon: Lock,
    title: 'Create your account',
    body: 'Sign up with your institute email and pick your hostel and mess.',
  },
  {
    icon: Send,
    title: 'Submit a request',
    body: 'Describe the issue or lost item, add a photo and send it to the right authority.',
  },
  {
    icon: ClipboardList,
    title: 'Track every update',
    body: 'Follow status changes, remarks and reminders from your dashboard.',
  },
  {
    icon: ShieldCheck,
    title: 'Get it resolved',
    body: 'Authorities act on your request and you see the outcome in the timeline.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-navy-50/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-600">How it works</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
            From problem to resolution in four simple steps
          </h2>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ icon: Icon, title, body }, index) => (
            <div
              key={title}
              className="group relative rounded-2xl border border-navy-100 bg-white p-6 shadow-card transition duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-navy-800 transition group-hover:bg-navy-800 group-hover:text-sky-200">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-navy-300">0{index + 1}</span>
              </div>
              <h3 className="mt-5 text-base font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const BENEFITS = [
  {
    title: 'Accountability built in',
    body: 'Every status change and remark is recorded with the authority who made it.',
  },
  {
    title: 'Privacy by design',
    body: 'Contact details stay private, and matches are only suggested, never announced.',
  },
  {
    title: 'Less chasing, more clarity',
    body: 'Automatic reminders nudge the right person when a request has been waiting too long.',
  },
  {
    title: 'One account for everything',
    body: 'Hostel, internet, mess and Lost & Found live together under a single sign-in.',
  },
];

export function Benefits() {
  return (
    <section id="benefits" className="scroll-mt-20 bg-white py-20 lg:py-28">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-sky-600">Benefits</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
            Built for students, respected by administrators
          </h2>
          <p className="mt-5 max-w-lg text-base leading-relaxed text-navy-600">
            CampusConnect replaces scattered messages and paper registers with a single, transparent workflow that
            everyone can follow.
          </p>
          <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-navy-800 to-navy-900 px-5 py-4 text-white shadow-lift">
            <Zap className="h-5 w-5 text-sky-300" aria-hidden="true" />
            <span className="text-sm font-medium">Faster routing, clearer ownership, fewer follow-up calls.</span>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {BENEFITS.map((benefit) => (
            <div
              key={benefit.title}
              className="rounded-2xl border border-navy-100 bg-navy-50/40 p-6 transition duration-300 hover:border-sky-200 hover:bg-white hover:shadow-card"
            >
              <h3 className="text-base font-semibold text-navy-900">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy-600">{benefit.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
