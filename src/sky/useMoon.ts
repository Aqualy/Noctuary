import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { fetchMoon } from './cyclecalcs';
import { calculateMoon } from './local';
import type { MoonState, Place, Source } from './types';

const REFRESH_MS = 5 * 60 * 1000;
const MAX_SAVED_AGE_MS = 3 * 60 * 60 * 1000; // older data would show the wrong Moon

const cacheKey = (place: Place) => `moon:${place.lat},${place.lon}`;

async function readSaved(place: Place): Promise<MoonState | null> {
  try {
    const json = await AsyncStorage.getItem(cacheKey(place));
    const saved = json ? (JSON.parse(json) as MoonState) : null;
    return saved && Date.now() - Date.parse(saved.at) < MAX_SAVED_AGE_MS ? saved : null;
  } catch {
    return null;
  }
}

type Shown = { moon: MoonState; source: Source };

// Starts from the calculated Moon, then live data; on failure saved data, otherwise a fresh calculation.
export function useMoon(place: Place) {
  const [shown, setShown] = useState<Shown>(() => ({ moon: calculateMoon(place), source: 'calculated' }));
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const id = ++request.current;
    setLoading(true);
    let next: Shown;
    let error = false;
    try {
      const moon = await fetchMoon(place);
      next = { moon, source: 'live' };
      AsyncStorage.setItem(cacheKey(place), JSON.stringify(moon)).catch(() => {});
    } catch {
      error = true;
      const saved = await readSaved(place);
      next = saved ? { moon: saved, source: 'saved' } : { moon: calculateMoon(place), source: 'calculated' };
    }
    if (id !== request.current) return; // a newer request has started, or the screen is gone
    setShown(next);
    setFailed(error);
    setLoading(false);
  }, [place]);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, REFRESH_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      request.current++;
      clearInterval(timer);
      sub.remove();
    };
  }, [refresh]);

  return { ...shown, loading, failed, refresh };
}
