// MoonState -> shader inputs. View space: x right, y up (zenith), z towards the viewer.
import type { MoonState } from './types';

const RAD = Math.PI / 180;

export function sunVector(m: MoonState): [number, number, number] {
  const side = Math.sin(m.sunAngle * RAD);
  return [-side * Math.sin(m.limb * RAD), side * Math.cos(m.limb * RAD), Math.cos(m.sunAngle * RAD)];
}

// yaw, pitch, roll in radians; roll within -pi..pi
export function trueTurn(m: MoonState): [number, number, number] {
  const lean = ((((m.lean + 180) % 360) + 360) % 360) - 180;
  return [-m.librationLon * RAD, m.librationLat * RAD, lean * RAD];
}
