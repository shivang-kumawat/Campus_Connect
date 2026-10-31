import { useEffect, useState, type FormEvent } from 'react';
import { Building2, Mail, Pencil, ShieldCheck, Utensils, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { SelectField, TextField } from '@/components/ui/FormFields';
import { MESSES, ROLE_LABELS, type Mess } from '@/config/campus';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';
import { updateOwnProfile } from '@/services/profileService';
import type { Profile, VerificationStatus } from '@/types/profile';

const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  not_required: 'Not required',
  pending: 'Pending review',
  approved: 'Verified by hostel warden',
  rejected: 'Not verified',
};

function DetailRow({ icon: Icon, label, value, note }: { icon: typeof Mail; label: string; value: string; note?: string }) {
  return (
    <div className="flex items-start gap-4 py-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-navy-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">{label}</p>
        <p className="mt-0.5 break-words text-sm font-medium text-navy-900">{value}</p>
        {note && <p className="mt-1 text-xs text-navy-500">{note}</p>}
      </div>
    </div>
  );
}

export function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    document.title = 'My profile | CampusConnect';
  }, []);

  if (!profile) return null;

  return (
    <div className="space-y-8 animate-fade-up">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-sky-700">Account</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900 sm:text-3xl">My profile</h1>
          <p className="mt-2 text-sm text-navy-600">Keep your details current so authorities can reach you.</p>
        </div>
        <Button variant="secondary" onClick={() => setEditing(true)}>
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Edit profile
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-3xl bg-gradient-to-br from-navy-800 to-navy-950 p-6 text-white shadow-lift lg:col-span-1">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-2xl font-semibold text-sky-200">
            {profile.full_name.charAt(0).toUpperCase()}
          </span>
          <p className="mt-5 text-xl font-semibold">{profile.full_name}</p>
          <p className="mt-1 text-sm text-navy-200">{ROLE_LABELS[profile.role]}</p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-semibold text-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Active account
          </div>
        </section>

        <section className="divide-y divide-navy-100 rounded-3xl border border-navy-100 bg-white px-6 shadow-card lg:col-span-2">
          <DetailRow icon={UserRound} label="Full name" value={profile.full_name} />
          <DetailRow icon={Mail} label="Institute email" value={profile.email} note="Email changes are not available yet." />
          <DetailRow icon={Building2} label="Hostel" value={profile.hostel ?? 'Not set'} note="To change your hostel, contact your hostel warden." />
          <DetailRow icon={Utensils} label="Mess" value={profile.mess ?? 'Not set'} />
          <DetailRow
            icon={ShieldCheck}
            label="Hostel verification"
            value={VERIFICATION_LABELS[profile.verification_status]}
            note={profile.verification_remark ? `Warden remark: ${profile.verification_remark}` : undefined}
          />
        </section>
      </div>

      {editing && (
        <EditProfileModal
          profile={profile}
          onClose={() => setEditing(false)}
          onSaved={async () => {
            await refreshProfile();
            notify('Your profile has been updated.', 'success');
            setEditing(false);
          }}
        />
      )}
    </div>
  );
}

interface EditProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onSaved: () => Promise<void>;
}

function EditProfileModal({ profile, onClose, onSaved }: EditProfileModalProps) {
  const { notify } = useToast();
  const [fullName, setFullName] = useState(profile.full_name);
  const [mess, setMess] = useState<Mess | ''>(profile.mess ?? '');
  const [errors, setErrors] = useState<{ fullName?: string; mess?: string }>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (fullName.trim().length < 2 || fullName.trim().length > 100) {
      nextErrors.fullName = 'Enter a name between 2 and 100 characters.';
    }
    if (!mess) nextErrors.mess = 'Select your mess.';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !mess) return;

    setSaving(true);
    try {
      await updateOwnProfile(profile.id, { full_name: fullName.trim(), mess });
      await onSaved();
    } catch {
      notify('We could not save your profile. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open title="Edit profile" description="Update your name and allotted mess." onClose={onClose}>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <TextField
          label="Full name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={errors.fullName}
        />
        <SelectField
          label="Mess"
          options={MESSES}
          placeholder="Select mess"
          value={mess}
          onChange={(event) => setMess(event.target.value as Mess | '')}
          error={errors.mess}
        />
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}
