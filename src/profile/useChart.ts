import { useMemo } from 'react';
import type { Signs } from '../chat/ask';
import { birthChart, signOf, type Chart } from '../sky/chart';
import { useProfile } from './ProfileProvider';

// The chart of the birth details in the profile, or null when there is no birth date.
export function useChart(): { chart: Chart | null; signs: Signs; hash: string } {
  const { answers } = useProfile();
  return useMemo(() => {
    if (!answers?.birth_date) return { chart: null, signs: {}, hash: '' };
    const chart = birthChart({
      date: answers.birth_date,
      time: answers.birth_time?.slice(0, 5) ?? null, // Postgres answers HH:MM:SS
      lat: answers.lat,
      lon: answers.lon,
      tz: answers.tz,
    });
    const certain = (name: string) => {
      const p = chart.planets.find((x) => x.name === name);
      return p?.certain ? p.sign : undefined;
    };
    const rising = chart.ascendant === null ? undefined : signOf(chart.ascendant);
    const planets = chart.planets.map((p) => `${p.name.slice(0, 2)}${p.certain ? p.sign.slice(0, 3) : '?'}${p.house ?? ''}`);
    return { chart, signs: { sun: certain('Sun'), moon: certain('Moon'), rising }, hash: [...planets, rising?.slice(0, 3) ?? '-'].join('.') };
  }, [answers]);
}
