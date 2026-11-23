// Live Moon data. Docs: https://www.cyclecalcs.com/api.html
import type { MoonState, Place } from './types';

const BASE = 'https://www.cyclecalcs.com/v2';
const TIMEOUT_MS = 10000;

async function get(path: string, place: Place, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(`${BASE}/${path}?lat=${place.lat}&lon=${place.lon}`, { signal });
  if (!response.ok) throw new Error(`CycleCalcs answered ${response.status}`);
  return response.json();
}

// Reads a nested field and checks its type, so a changed API becomes an error state, not a broken Moon.
function read(json: unknown, path: string): unknown {
  let value: any = json;
  for (const key of path.split('.')) value = value?.[key];
  return value;
}
function num(json: unknown, path: string): number {
  const value = read(json, path);
  if (typeof value !== 'number') throw new Error(`CycleCalcs: ${path} is missing`);
  return value;
}
function text(json: unknown, path: string): string {
  const value = read(json, path);
  if (typeof value !== 'string') throw new Error(`CycleCalcs: ${path} is missing`);
  return value;
}

// Can be absent on a day without rise or set.
function firstTime(json: unknown, path: string): string | null {
  const value = read(json, path);
  const first = Array.isArray(value) ? value[0] : value;
  return typeof first === 'string' ? first : null;
}
function phases(json: unknown): MoonState['next'] {
  const list = read(json, 'data.next_phases');
  if (!Array.isArray(list)) throw new Error('CycleCalcs: data.next_phases is missing');
  return list.filter((p) => typeof p?.name === 'string' && typeof p?.instant === 'string').map((p) => ({ name: p.name, at: p.instant }));
}

export function toMoonState(moon: unknown, libration: unknown): MoonState {
  return {
    at: text(moon, 'computed_at'),
    phaseName: text(moon, 'data.phase.name'),
    waxing: read(moon, 'data.phase.waxing') === true,
    illumination: num(moon, 'data.phase.illumination_percent'),
    ageDays: num(moon, 'data.phase.age_days'),
    sunAngle: num(moon, 'data.phase.illumination_phase_angle_deg'),
    limb: num(moon, 'data.bright_limb.orientation_angle_deg'),
    lean: num(libration, 'data.topocentric.axis_position_angle_deg') - num(moon, 'data.bright_limb.parallactic_angle_deg'),
    librationLon: num(libration, 'data.libration_topocentric.longitude_deg'),
    librationLat: num(libration, 'data.libration_topocentric.latitude_deg'),
    distanceKm: num(moon, 'data.position_geocentric.distance_km'),
    altitude: num(moon, 'data.position_topocentric.horizontal.altitude_refracted_deg'),
    compass: text(moon, 'data.position_topocentric.horizontal.compass'),
    rise: firstTime(moon, 'data.rise_set.rise'),
    set: firstTime(moon, 'data.rise_set.set'),
    next: phases(moon),
  };
}

export async function fetchMoon(place: Place): Promise<MoonState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const [moon, libration] = await Promise.all([
      get('moon', place, controller.signal),
      get('libration', place, controller.signal),
    ]);
    return toMoonState(moon, libration);
  } finally {
    clearTimeout(timer);
  }
}
