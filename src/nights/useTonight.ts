import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../../utils/supabase';
import type { MoonState } from '../sky/types';

// A night runs from noon to noon, so after midnight it is still the same night.
export function nightOf(now = new Date()): string {
  const d = new Date(now);
  d.setHours(d.getHours() - 12);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export type Tonight = 'loading' | 'unsaved' | 'saved' | 'error';

export function useTonight(userId: string) {
  const [status, setStatus] = useState<Tonight>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const request = useRef(0);

  const load = useCallback(async () => {
    const id = ++request.current;
    const { data, error } = await supabase.from('nights').select('id').eq('user_id', userId).eq('local_date', nightOf()).maybeSingle();
    if (id !== request.current) return;
    setStatus(error ? 'error' : data ? 'saved' : 'unsaved');
    setMessage(error ? 'Your saved nights could not be loaded.' : null);
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

  const change = async (next: 'saved' | 'unsaved', action: () => PromiseLike<{ error: { code?: string } | null }>) => {
    request.current++; // an older load must not overwrite this
    setBusy(true);
    setMessage(null);
    const { error } = await action();
    setBusy(false);
    // 23505: this night was already saved, for example on another phone
    if (error && error.code !== '23505') setMessage(next === 'saved' ? 'This night could not be saved.' : 'This night could not be removed.');
    else setStatus(next);
  };

  // user_id is filled in by the database (auth.uid()), never by the app
  const save = (moon: MoonState) =>
    change('saved', () => supabase.from('nights').insert({ local_date: nightOf(), phase: moon.phaseName, illumination: moon.illumination }));

  const remove = () => change('unsaved', () => supabase.from('nights').delete().eq('user_id', userId).eq('local_date', nightOf()));

  return { status, busy, message, load, save, remove };
}
