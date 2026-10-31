import { ArrowRight, LifeBuoy, PackageSearch, Wrench, type LucideIcon } from 'lucide-react';

export interface QuickLink {
  id: 'report-issue' | 'lost-found' | 'student-services';
  label: string;
  description: string;
  icon: LucideIcon;
}

const QUICK_LINKS: readonly QuickLink[] = [
  {
    id: 'report-issue',
    label: 'Report Campus Issue',
    description: 'Hostel, internet, mess and facility problems',
    icon: Wrench,
  },
  {
    id: 'lost-found',
    label: 'Lost & Found',
    description: 'Post or search for lost and found items',
    icon: PackageSearch,
  },
  {
    id: 'student-services',
    label: 'Student Services',
    description: 'Requests, certificates and campus support',
    icon: LifeBuoy,
  },
];

interface QuickLinksPanelProps {
  onSelect: (link: QuickLink) => void;
}

export function QuickLinksPanel({ onSelect }: QuickLinksPanelProps) {
  return (
    <aside className="flex flex-col bg-gradient-to-br from-sky-700 via-navy-800 to-navy-900 p-8 text-white md:p-10">
      <div className="animate-fade-up">
        <h2 className="text-2xl font-semibold leading-tight">Welcome to CampusConnect</h2>
        <p className="mt-2 text-sm leading-relaxed text-sky-100">Making Campus Life Smarter, Together.</p>
      </div>

      <p className="mt-10 text-xs font-semibold uppercase tracking-wider text-sky-200">Quick Links</p>
      <ul className="mt-3 space-y-3">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <li key={link.id}>
              <button
                type="button"
                onClick={() => onSelect(link)}
                className="group flex w-full items-center gap-4 rounded-2xl border border-white/15 bg-white/5 p-4 text-left transition duration-200 hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky-200">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-white">{link.label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-sky-100/80">{link.description}</span>
                </span>
                <ArrowRight
                  className="h-4 w-4 shrink-0 text-sky-200 transition duration-200 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
