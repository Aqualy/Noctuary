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
  answers: Answers | null;
  save: (answers: Answers) => Promise<boolean>;
  later: () => void;
  askAgain: () => void;
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
  const [loaded, setLoaded] = useState<{ userId: string; status: Status; answers: Answers | null } | null>(null);
  const request = useRef(0);

  useEffect(() => {
    if (!userId) return;
    const id = ++request.current;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000); // no connection must not keep the Moon away
    supabase.from('profiles').select('name, birth_date, birth_time, birth_place, lat, lon, tz, onboarded_at').eq('user_id', userId).abortSignal(controller.signal).maybeSingle().then(({ data, error }) => {
      clearTimeout(timer);
      if (id !== request.current) return;
      setLoaded({ userId, status: error ? 'unknown' : data?.onboarded_at ? 'known' : 'new', answers: data });
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
    setLoaded({ userId, status: 'known', answers });
    return true;
  }, [userId]);

  const later = useCallback(() => {
    if (userId) setLoaded((l) => ({ userId, status: l?.answers ? 'known' : 'unknown', answers: l?.answers ?? null }));
  }, [userId]);

  const askAgain = useCallback(() => {
    if (userId) setLoaded((l) => ({ userId, status: 'new', answers: l?.answers ?? null }));
  }, [userId]);

  const mine = loaded && loaded.userId === userId ? loaded : null;
  return (
    <ProfileContext value={{ status: mine?.status ?? 'loading', answers: mine?.answers ?? null, save, later, askAgain }}>
      {children}
    </ProfileContext>
  );
}
