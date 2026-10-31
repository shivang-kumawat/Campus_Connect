import { useAuth } from '@/hooks/useAuth';
import { EmptyModule } from '@/components/dashboard/DashboardCards';
import { ROLE_COMPLAINT_CATEGORIES } from '@/config/complaints';
import { StudentComplaints } from '@/dashboards/StudentComplaints';
import { AuthorityComplaintQueue } from '@/dashboards/AuthorityComplaintQueue';

export function ComplaintsPage() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role === 'student') return <StudentComplaints profile={profile} />;
  if (ROLE_COMPLAINT_CATEGORIES[profile.role].length > 0) return <AuthorityComplaintQueue role={profile.role} />;
  return (
    <div className="animate-fade-up">
      <EmptyModule message="Complaint handling is not assigned to your role." />
    </div>
  );
}
