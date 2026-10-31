import { supabase } from '@/lib/supabase';
import type { Mess } from '@/config/campus';
import type { AllowedEmailDomain, Profile } from '@/types/profile';

const PROFILE_COLUMNS =
  'id, full_name, email, role, hostel, mess, verification_status, verification_remark, verified_by, verified_at, created_at, updated_at';

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export interface ProfileUpdate {
  full_name: string;
  mess: Mess;
}

export async function updateOwnProfile(userId: string, update: ProfileUpdate): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update(update)
    .eq('id', userId)
    .select(PROFILE_COLUMNS)
    .single();
  if (error) throw error;
  return data as Profile;
}

export async function fetchAllowedEmailDomains(): Promise<AllowedEmailDomain[]> {
  const { data, error } = await supabase
    .from('allowed_email_domains')
    .select('domain, label, is_demo')
    .order('label');
  if (error) throw error;
  return (data ?? []) as AllowedEmailDomain[];
}
