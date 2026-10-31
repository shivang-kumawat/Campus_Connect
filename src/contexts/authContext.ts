import { createContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/profile';

export interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  profileError: string | null;
  signInInProgress: boolean;
  setSignInInProgress: (inProgress: boolean) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
