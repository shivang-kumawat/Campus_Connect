export const HOSTELS = ['BH1', 'BH2', 'BH3', 'BH4', 'GH', 'GH Extension'] as const;
export const MESSES = ['Mess A', 'Mess B', 'Mess C'] as const;

export const ROLES = [
  'student',
  'hostel_warden',
  'chief_warden',
  'it_department',
  'cosha',
  'mess_warden',
  'assistant_registrar',
] as const;

export type Hostel = (typeof HOSTELS)[number];
export type Mess = (typeof MESSES)[number];
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  hostel_warden: 'Hostel Warden',
  chief_warden: 'Chief Warden',
  it_department: 'IT Department',
  cosha: 'COSHA',
  mess_warden: 'Mess Warden',
  assistant_registrar: 'Assistant Registrar',
};

export const MIN_PASSWORD_LENGTH = 8;
