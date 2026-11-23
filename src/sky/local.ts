// The Moon calculated on the phone: shown while loading and when there is no connection.
import {
  Body, Equator, GeoMoon, Horizon, Illumination, KM_PER_AU, Libration, MoonPhase, Observer, RotationAxis, SearchMoonPhase, SiderealTime,
} from 'astronomy-engine';
import type { MoonState, Place } from './types';

const RAD = Math.PI / 180;
const COMPASS = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
const mod = (x: number, n: number) => ((x % n) + n) % n;

type Radec = { ra: number; dec: number }; // hours, degrees

// Direction from one point in the sky to another, from north through east.
function positionAngle(from: Radec, to: Radec): number {
  const da = (to.ra - from.ra) * 15 * RAD;
  const d1 = from.dec * RAD;
  const d2 = to.dec * RAD;
  return Math.atan2(Math.cos(d2) * Math.sin(da), Math.sin(d2) * Math.cos(d1) - Math.cos(d2) * Math.sin(d1) * Math.cos(da)) / RAD;
}

function phaseName(elongation: number): string {
  const near = (target: number) => Math.abs(mod(elongation - target + 180, 360) - 180) < 6;
  if (near(0)) return 'New Moon';
  if (near(90)) return 'First Quarter';
  if (near(180)) return 'Full Moon';
  if (near(270)) return 'Last Quarter';
  if (elongation < 90) return 'Waxing Crescent';
  if (elongation < 180) return 'Waxing Gibbous';
  return elongation < 270 ? 'Waning Gibbous' : 'Waning Crescent';
}

export function calculateMoon(place: Place, date = new Date()): MoonState {
  const observer = new Observer(place.lat, place.lon, 0);
  const j2000 = Equator(Body.Moon, date, observer, false, true);
  const sun = Equator(Body.Sun, date, observer, false, true);
  const ofDate = Equator(Body.Moon, date, observer, true, true);
  const horizon = Horizon(date, observer, ofDate.ra, ofDate.dec, 'normal');
  const libration = Libration(date);
  const elongation = MoonPhase(date);
  const light = Illumination(Body.Moon, date);
  const newMoon = SearchMoonPhase(0, date, -30);

  // direction of the zenith, positive when the Moon is west of the meridian
  const zenith = { ra: SiderealTime(date) + place.lon / 15, dec: place.lat };
  const parallactic = positionAngle(ofDate, zenith);

  return {
    at: date.toISOString(),
    phaseName: phaseName(elongation),
    waxing: elongation < 180,
    illumination: Math.round(light.phase_fraction * 1000) / 10,
    ageDays: newMoon ? (date.getTime() - newMoon.date.getTime()) / 86400000 : 0,
    sunAngle: light.phase_angle,
    limb: mod(positionAngle(j2000, sun) - parallactic, 360),
    lean: mod(positionAngle(j2000, RotationAxis(Body.Moon, date)) - parallactic, 360),
    librationLon: libration.elon,
    librationLat: libration.elat,
    distanceKm: GeoMoon(date).Length() * KM_PER_AU,
    altitude: horizon.altitude,
    compass: COMPASS[Math.round(mod(horizon.azimuth, 360) / 22.5) % 16],
  };
}
