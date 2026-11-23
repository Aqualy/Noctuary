// Turns time + mood + speech into shader uniforms. No state, so it runs on the UI thread.
export type Mood = 'calm' | 'joy' | 'sorrow' | 'stern' | 'wonder';
export type Face = { open: number; smile: number; brow: number; glow: number };
export type Syllable = { at: number; len: number; open: number }; // seconds, seconds, 0..1
export type MoonInput = {
  time: number; // seconds
  face: Face; // current (already eased) expression
  jaw: number; // 0..1, from the syllable schedule
  gaze: number[]; // x, y in -1..1, towards the touch
  turn: number[]; // yaw, pitch, roll in radians: libration + drag
  still: boolean; // Reduce Motion
};

export const FACES: Record<Mood, Face> = {
  calm: { open: 0.5, smile: 0.1, brow: 0, glow: 0.35 },
  joy: { open: 0.62, smile: 1, brow: 0.35, glow: 0.6 },
  sorrow: { open: 0.3, smile: -0.8, brow: 0.45, glow: 0.2 },
  stern: { open: 0.45, smile: -0.4, brow: -1, glow: 0.5 },
  wonder: { open: 1, smile: 0.15, brow: 1, glow: 0.9 },
};
export const ASLEEP: Face = { open: 0, smile: 0, brow: 0, glow: 0 };

export function easeFace(a: Face, b: Face, k: number): Face {
  'worklet';
  return {
    open: a.open + (b.open - a.open) * k,
    smile: a.smile + (b.smile - a.smile) * k,
    brow: a.brow + (b.brow - a.brow) * k,
    glow: a.glow + (b.glow - a.glow) * k,
  };
}

// 1 = eyes as the mood wants them, 0 = shut. Each 4.5 s window hides one blink at an irregular moment.
export function blink(time: number): number {
  'worklet';
  const w = Math.floor(time / 4.5);
  const n = Math.sin(w * 91.7) * 437.5;
  const t = time - w * 4.5 - 0.6 - (n - Math.floor(n)) * 3;
  if (t < 0 || t > 0.42) return 1;
  if (t < 0.14) return 1 - t / 0.14;
  return Math.max(0, Math.min(1, (t - 0.18) / 0.24));
}

export function jawAt(list: Syllable[], time: number): number {
  'worklet';
  let j = 0;
  for (let i = 0; i < list.length; i++) {
    const u = (time - list[i].at) / list[i].len;
    if (u > 0 && u < 1) j = Math.max(j, Math.sin(Math.PI * Math.pow(u, 0.7)) * list[i].open);
  }
  return j;
}

export function pose(i: MoonInput) {
  'worklet';
  const t = i.still ? 0 : i.time;
  const b = i.still ? 1 : blink(i.time);
  const breath = Math.sin(t * 0.9);
  return {
    uTurn: [
      i.turn[0] + Math.sin(t * 0.43) * 0.012,
      i.turn[1] + breath * 0.006 + i.jaw * 0.012,
      i.turn[2] + Math.sin(t * 0.31) * 0.006,
    ],
    uOpen: i.face.open * b,
    uJaw: i.jaw,
    uSmile: i.face.smile,
    uBrow: i.face.brow + i.jaw * 0.12,
    uGaze: [i.gaze[0] + Math.sin(t * 0.7) * 0.06, i.gaze[1]],
    uGlow: i.face.glow * (0.9 + 0.1 * breath),
  };
}
