// Next eclipses. They are global: not every eclipse is visible from the user's place.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';

export type Eclipse = { label: string; at: string };
const KEY = 'eclipses';
const DAY = 24 * 60 * 60 * 1000;

async function fetchEclipses(): Promise<Eclipse[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch('https://www.cyclecalcs.com/v2/eclipses', { signal: controller.signal });
    if (!response.ok) throw new Error(`CycleCalcs answered ${response.status}`);
    const list = (await response.json())?.data?.eclipses;
    if (!Array.isArray(list)) throw new Error('CycleCalcs: eclipses are missing');
    return list.filter((e) => typeof e.label === 'string' && typeof e.peak === 'string').map((e) => ({ label: e.label, at: e.peak }));
  } finally {
    clearTimeout(timer);
  }
}

export function useEclipses() {
  const [eclipses, setEclipses] = useState<Eclipse[] | null>(null);
  const [failed, setFailed] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setFailed(false);
    const upcoming = (list: Eclipse[]) => list.filter((e) => Date.parse(e.at) > Date.now());
    const saved = await AsyncStorage.getItem(KEY).then((j) => (j ? (JSON.parse(j) as { at: number; list: Eclipse[] }) : null)).catch(() => null);
    if (!alive.current) return;
    if (saved) setEclipses(upcoming(saved.list));
    if (saved && Date.now() - saved.at < DAY && upcoming(saved.list).length) return;
    try {
      const list = await fetchEclipses();
      AsyncStorage.setItem(KEY, JSON.stringify({ at: Date.now(), list })).catch(() => {});
      if (alive.current) setEclipses(upcoming(list));
    } catch {
      if (alive.current && !saved) setFailed(true); // dates of eclipses do not change, so a saved list is fine
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  return { eclipses, failed, load };
}
