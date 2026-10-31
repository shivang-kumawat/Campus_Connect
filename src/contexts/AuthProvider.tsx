import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { fetchProfile } from '@/services/profileService';
import { signOutUser } from '@/services/authService';
import type { Profile } from '@/types/profile';
import { AuthContext, type AuthContextValue } from '@/contexts/authContext';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [signInInProgress, setSignInInProgress] = useState(false);

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const data = await fetchProfile(userId);
      setProfile(data);
      setProfileError(data ? null : 'We could not find your CampusConnect profile. Please contact support.');
    } catch {
      setProfile(null);
      setProfileError('We could not load your profile. Check your connection and try again.');
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session) await loadProfile(session.user.id);
  }, [session, loadProfile]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        loadProfile(data.session.user.id).finally(() => active && setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      (async () => {
        if (!active) return;
        setSession(nextSession);
        if (nextSession) {
          await loadProfile(nextSession.user.id);
        } else {
          setProfile(null);
          setProfileError(null);
        }
      })();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    await signOutUser();
    setProfile(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading,
      profileError,
      signInInProgress,
      setSignInInProgress,
      refreshProfile,
      signOut,
    }),
    [session, profile, loading, profileError, signInInProgress, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
