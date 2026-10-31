import { ClipboardList, LayoutDashboard, PackageSearch, UserCircle2, type LucideIcon } from 'lucide-react';
import type { Role } from '@/config/campus';
import { ROLE_COMPLAINT_CATEGORIES } from '@/config/complaints';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

const OVERVIEW_NAV: NavItem = { label: 'Overview', to: '/dashboard', icon: LayoutDashboard };
const PROFILE_NAV: NavItem = { label: 'My Profile', to: '/profile', icon: UserCircle2 };
const MY_COMPLAINTS_NAV: NavItem = { label: 'My Complaints', to: '/complaints', icon: ClipboardList };
const COMPLAINT_QUEUE_NAV: NavItem = { label: 'Complaints', to: '/complaints', icon: ClipboardList };
const LOST_FOUND_NAV: NavItem = { label: 'Lost & Found', to: '/lost-found', icon: PackageSearch };

export function getDashboardNav(role: Role): NavItem[] {
  const nav: NavItem[] = [OVERVIEW_NAV];
  if (role === 'student') nav.push(MY_COMPLAINTS_NAV);
  else if (ROLE_COMPLAINT_CATEGORIES[role].length > 0) nav.push(COMPLAINT_QUEUE_NAV);
  if (role === 'student' || role === 'assistant_registrar') nav.push(LOST_FOUND_NAV);
  nav.push(PROFILE_NAV);
  return nav;
}
