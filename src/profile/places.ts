// City search. Docs: https://open-meteo.com/en/docs/geocoding-api
import { useEffect, useState } from 'react';

export type FoundPlace = { id: number; label: string; lat: number; lon: number; tz: string };
export type Search = { status: 'idle' | 'searching' | 'done' | 'error'; places: FoundPlace[] };

const IDLE: Search = { status: 'idle', places: [] };

export async function searchPlaces(text: string, signal: AbortSignal): Promise<FoundPlace[]> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(text)}&count=5&language=en`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Open-Meteo answered ${response.status}`);
  const json: { results?: any[] } = await response.json(); // no results: the field is absent
  return (json.results ?? [])
    .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number' && typeof r.timezone === 'string')
    .map((r) => ({
      id: r.id,
      label: [r.name, r.admin1 !== r.name ? r.admin1 : null, r.country].filter(Boolean).join(', '),
      lat: r.latitude,
      lon: r.longitude,
      tz: r.timezone,
    }));
}

// Searches a moment after the last keystroke; raise `attempt` to try again.
export function usePlaceSearch(text: string, attempt: number): Search {
  const [search, setSearch] = useState<Search>(IDLE);
  const query = text.trim();

  useEffect(() => {
    if (query.length < 2) {
      setSearch(IDLE);
      return;
    }
    const controller = new AbortController();
    setSearch({ status: 'searching', places: [] });
    const wait = setTimeout(() => {
      searchPlaces(query, controller.signal)
        .then((places) => {
          if (!controller.signal.aborted) setSearch({ status: 'done', places });
        })
        .catch(() => {
          if (!controller.signal.aborted) setSearch({ status: 'error', places: [] });
        });
    }, 400);
    return () => {
      clearTimeout(wait);
      controller.abort();
    };
  }, [query, attempt]);

  return search;
}
