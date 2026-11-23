import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../../utils/supabase';
import type { MoonState } from '../sky/types';

export type Night = { id: string; local_date: string; phase: string; illumination: number };

// A night runs from noon to noon, so after midnight it is still the same night.
export function nightOf(now = new Date()): string {
  const d = new Date(now);
  d.setHours(d.getHours() - 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useNights(userId: string) {
  const [nights, setNights] = useState<Night[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const id = ++request.current;
    const { data, error } = await supabase.from('nights').select('id, local_date, phase, illumination').eq('user_id', userId).order('local_date', { ascending: false }).limit(200);
    if (id !== request.current) return;
    if (data) setNights(data);
    setFailed(error !== null);
  }, [userId]);

  useEffect(() => {
    load();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') load();
    });
    return () => {
      request.current++;
      sub.remove();
    };
  }, [load]);

  // Nothing looks saved or removed before the database says so.
  const change = async (problem: string, action: () => PromiseLike<{ error: { code?: string } | null }>) => {
    setBusy(true);
    setMessage(null);
    const { error } = await action();
    setBusy(false);
    // 23505: this night was already saved, for example on another phone
    if (error && error.code !== '23505') setMessage(problem);
    else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await load();
    }
  };

  // user_id is filled in by the database (auth.uid()), never by the app
  const save = (moon: MoonState) =>
    change('This night could not be saved.', () => supabase.from('nights').insert({ local_date: nightOf(), phase: moon.phaseName, illumination: moon.illumination }));

  const remove = (id: string) => change('This night could not be removed.', () => supabase.from('nights').delete().eq('id', id));

  const tonight = nights?.find((n) => n.local_date === nightOf()) ?? null;
  return { nights, tonight, failed, busy, message, load, save, remove };
}
