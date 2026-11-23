// Birth chart, calculated on the phone. Tropical zodiac, whole-sign houses.
import { Body, Ecliptic, e_tilt, GeoVector, MakeTime, SiderealTime } from 'astronomy-engine';

export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const BODIES = [Body.Sun, Body.Moon, Body.Mercury, Body.Venus, Body.Mars, Body.Jupiter, Body.Saturn, Body.Uranus, Body.Neptune, Body.Pluto];
const RAD = Math.PI / 180;
const mod = (x: number, n: number) => ((x % n) + n) % n;

export type Birth = { date: string; time: string | null; lat: number | null; lon: number | null; tz: string | null };
export type Planet = { name: string; longitude: number; sign: string; house: number | null; certain: boolean };
export type Chart = { planets: Planet[]; ascendant: number | null; exact: boolean };

export const signOf = (longitude: number) => SIGNS[Math.floor(mod(longitude, 360) / 30)];

// What the clock in that zone showed at a moment, as if it were UTC.
function wallClock(utc: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric',
  }).formatToParts(new Date(utc));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
}

// Local birth time -> UTC, with the summer time and zone rules of that year.
export function birthMoment(date: string, time: string, tz: string | null): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);
  const wanted = Date.UTC(y, m - 1, d, h, min);
  if (!tz) return new Date(wanted);
  let utc = wanted;
  for (let i = 0; i < 3; i++) utc += wanted - wallClock(utc, tz);
  return new Date(utc);
}

function longitude(body: Body, when: Date): number {
  return Ecliptic(GeoVector(body, when, true)).elon;
}

export function ascendantAt(when: Date, lat: number, lon: number): number {
  const ramc = mod(SiderealTime(when) * 15 + lon, 360) * RAD;
  const tilt = e_tilt(MakeTime(when)).tobl * RAD;
  return mod(Math.atan2(Math.cos(ramc), -(Math.sin(ramc) * Math.cos(tilt) + Math.tan(lat * RAD) * Math.sin(tilt))) / RAD, 360);
}

export function birthChart({ date, time, lat, lon, tz }: Birth): Chart {
  const exact = time !== null && tz !== null;
  const when = birthMoment(date, exact ? time : '12:00', tz);
  const ascendant = exact && lat !== null && lon !== null ? ascendantAt(when, lat, lon) : null;
  // Without a time, a planet is certain only if it stays in one sign all day.
  const start = birthMoment(date, '00:00', tz).getTime() - (tz ? 0 : 14 * 3600000);
  const end = birthMoment(date, '23:59', tz).getTime() + (tz ? 0 : 14 * 3600000);
  const planets = BODIES.map((body) => {
    const l = longitude(body, when);
    const certain = exact || signOf(longitude(body, new Date(start))) === signOf(longitude(body, new Date(end)));
    const house = ascendant === null ? null : mod(Math.floor(l / 30) - Math.floor(ascendant / 30), 12) + 1;
    return { name: String(body), longitude: l, sign: signOf(l), house, certain };
  });
  return { planets, ascendant, exact };
}
