import { useAuth } from '@/hooks/useAuth';
import { WardenDashboard } from '@/dashboards/WardenDashboard';
import { AuthorityDashboard } from '@/dashboards/AuthorityDashboard';
import { AssistantRegistrarLostFound } from '@/dashboards/AssistantRegistrarLostFound';
import { RoleDashboardPending } from '@/dashboards/RoleDashboardPending';
import { StudentDashboard } from '@/dashboards/StudentDashboard';
import { ROLE_COMPLAINT_CATEGORIES } from '@/config/complaints';

export function DashboardPage() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role === 'student') return <StudentDashboard profile={profile} />;
  if (profile.role === 'hostel_warden') return <WardenDashboard profile={profile} />;
  if (ROLE_COMPLAINT_CATEGORIES[profile.role].length > 0) return <AuthorityDashboard profile={profile} />;
  if (profile.role === 'assistant_registrar') return <AssistantRegistrarLostFound />;
  return <RoleDashboardPending />;
}
