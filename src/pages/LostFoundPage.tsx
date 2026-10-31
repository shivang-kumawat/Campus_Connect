import { useAuth } from '@/hooks/useAuth';
import { EmptyModule } from '@/components/dashboard/DashboardCards';
import { StudentLostFound } from '@/dashboards/StudentLostFound';
import { AssistantRegistrarLostFound } from '@/dashboards/AssistantRegistrarLostFound';

export function LostFoundPage() {
  const { profile } = useAuth();
  if (!profile) return null;
  if (profile.role === 'student') return <StudentLostFound profile={profile} />;
  if (profile.role === 'assistant_registrar') return <AssistantRegistrarLostFound />;
  return (
    <div className="animate-fade-up">
      <EmptyModule message="Lost & Found is not available for your role." />
    </div>
  );
}
