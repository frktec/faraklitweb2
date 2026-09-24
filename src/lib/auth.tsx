import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Profile } from '@/types';

type AuthContextType = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  isAdmin: false,
  refreshProfile: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', uid)
        .maybeSingle();
      setProfile(data as Profile | null);
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let settled = false;

    const markLoaded = () => {
      if (mounted && !settled) {
        settled = true;
        setLoading(false);
      }
    };

    // Safety net: force loading to false after 4 seconds no matter what
    const timeout = setTimeout(markLoaded, 4000);

    // Primary path: getSession
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id).finally(markLoaded);
      } else {
        markLoaded();
      }
    }).catch(() => {
      markLoaded();
    });

    // Secondary path: onAuthStateChange (handles INITIAL_SESSION, token refresh, sign in/out)
    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const res = supabase.auth.onAuthStateChange((event, session) => {
        if (!mounted) return;

        setSession(session);

        if (session?.user) {
          (async () => {
            await fetchProfile(session.user.id);
            markLoaded();
          })();
        } else {
          setProfile(null);
          markLoaded();
        }
      });
      subscription = res.data.subscription;
    } catch {
      markLoaded();
    }

    return () => {
      mounted = false;
      clearTimeout(timeout);
      try {
        subscription?.unsubscribe();
      } catch {
        // ignore
      }
    };
  }, []);

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const isAdmin = session?.user?.app_metadata?.role === 'admin';

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, profile, loading, isAdmin, refreshProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}
