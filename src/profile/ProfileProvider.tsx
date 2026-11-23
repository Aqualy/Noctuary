import { createContext, use, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { supabase } from '../../utils/supabase';
import { useSession } from '../auth/SessionProvider';

export type Answers = {
  name: string | null;
  birth_date: string | null; // YYYY-MM-DD, as on the birth certificate
  birth_time: string | null; // HH:MM, local time at the birthplace; null = unknown
  birth_place: string | null;
  lat: number | null;
  lon: number | null;
  tz: string | null;
};

// 'unknown': the profile could not be read. The app opens anyway; the ritual waits for a next visit.
type Status = 'loading' | 'new' | 'known' | 'unknown';

type ProfileState = {
  status: Status;
  name: string | null;
  save: (answers: Answers) => Promise<boolean>;
  later: () => void;
};

const ProfileContext = createContext<ProfileState | null>(null);

export function useProfile(): ProfileState {
  const value = use(ProfileContext);
  if (!value) throw new Error('useProfile needs ProfileProvider');
  return value;
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  // Kept together with its user, so another account never sees it, not even for a moment.
  const [loaded, setLoaded] = useState<{ userId: string; status: Status; name: string | null } | null>(null);
  const request = useRef(0);

  useEffect(() => {
    if (!userId) return;
    const id = ++request.current;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000); // no connection must not keep the Moon away
    supabase.from('profiles').select('name, onboarded_at').eq('user_id', userId).abortSignal(controller.signal).maybeSingle().then(({ data, error }) => {
      clearTimeout(timer);
      if (id !== request.current) return;
      setLoaded({ userId, status: error ? 'unknown' : data?.onboarded_at ? 'known' : 'new', name: data?.name ?? null });
    });
    return () => {
      clearTimeout(timer);
      controller.abort();
      request.current++;
    };
  }, [userId]);

  const save = useCallback(async (answers: Answers) => {
    if (!userId) return false;
    const { error } = await supabase.from('profiles').upsert({ user_id: userId, ...answers, onboarded_at: new Date().toISOString() });
    if (error) return false;
    setLoaded({ userId, status: 'known', name: answers.name });
    return true;
  }, [userId]);

  const later = useCallback(() => {
    if (userId) setLoaded({ userId, status: 'unknown', name: null });
  }, [userId]);

  const mine = loaded && loaded.userId === userId ? loaded : null;
  return (
    <ProfileContext value={{ status: mine?.status ?? 'loading', name: mine?.name ?? null, save, later }}>
      {children}
    </ProfileContext>
  );
}
