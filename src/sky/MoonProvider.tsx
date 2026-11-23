// One Moon and one place, shared by all tabs.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Place } from './types';
import { useMoon } from './useMoon';

const ANTWERP: Place = { name: 'Antwerp', lat: 51.22, lon: 4.4 };
const SAVED = 'place';

type Shared = ReturnType<typeof useMoon> & { place: Place; setPlace: (place: Place) => void };
const MoonContext = createContext<Shared | null>(null);

export function useSharedMoon(): Shared {
  const value = use(MoonContext);
  if (!value) throw new Error('useSharedMoon needs MoonProvider');
  return value;
}

export function MoonProvider({ children }: { children: ReactNode }) {
  const [place, set] = useState<Place | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(SAVED)
      .then((json) => set(json ? (JSON.parse(json) as Place) : ANTWERP))
      .catch(() => set(ANTWERP));
  }, []);

  const setPlace = useCallback((next: Place) => {
    set(next);
    AsyncStorage.setItem(SAVED, JSON.stringify(next)).catch(() => {});
  }, []);

  return place ? <Loaded place={place} setPlace={setPlace}>{children}</Loaded> : null;
}

function Loaded({ place, setPlace, children }: { place: Place; setPlace: (place: Place) => void; children: ReactNode }) {
  const moon = useMoon(place);
  return <MoonContext value={{ ...moon, place, setPlace }}>{children}</MoonContext>;
}
