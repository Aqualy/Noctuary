export type Place = { name: string; lat: number; lon: number };

// The one description of the Moon that both picture and text use. Angles in degrees.
export type MoonState = {
  at: string; // ISO time the values belong to
  phaseName: string;
  waxing: boolean;
  illumination: number; // percent
  ageDays: number;
  sunAngle: number; // Sun-Moon-Earth angle: 0 full, 180 new
  limb: number; // bright limb, counterclockwise from the zenith
  lean: number; // Moon's north pole, counterclockwise from the zenith
  librationLon: number;
  librationLat: number;
  distanceKm: number; // geocentric
  altitude: number;
  compass: string;
};

export type Source = 'live' | 'saved' | 'calculated';
