// The Moon's language. The same word always becomes the same sounds, so it can be learned.
import type { Mood, Syllable } from '../moon/moonAnim';

const ONSETS = ['m', 'n', 'l', 'v', 'r', 'th', 'sh', 'd', 'g', 'k', ''];
const VOWELS = ['a', 'o', 'u', 'e'];
// 40 sounds: 10 beginnings x 4 vowels (the empty beginning is kept for the first syllable of short words)
export const SOUNDS = ONSETS.slice(0, 10).flatMap((o) => VOWELS.map((v) => o + v));
const OPEN: Record<string, number> = { a: 1, o: 0.75, e: 0.6, u: 0.45 };

export type Spoken = Syllable & { sound: string };
export type Word = { text: string; at: number };
export type Utterance = { syllables: Spoken[]; words: Word[]; length: number };

function seed(word: string): number {
  let h = 2166136261;
  for (let i = 0; i < word.length; i++) h = Math.imul(h ^ word.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function soundsOf(word: string): string[] {
  const plain = word.toLowerCase().normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '');
  if (!plain) return [];
  const count = Math.max(1, Math.min(4, Math.round(plain.length / 3)));
  let h = seed(plain);
  const sounds: string[] = [];
  for (let i = 0; i < count; i++) {
    h = Math.imul(h ^ (h >>> 13), 1540483477) >>> 0;
    sounds.push(SOUNDS[h % SOUNDS.length]);
  }
  return sounds;
}

const PACE: Record<Mood, number> = { calm: 1, joy: 0.85, sorrow: 1.3, stern: 1.1, wonder: 1.15 };

// When every sound starts; voice, mouth and subtitles all follow this one list.
export function utter(text: string, mood: Mood): Utterance {
  const syllables: Spoken[] = [];
  const words: Word[] = [];
  const pace = PACE[mood];
  let at = 0.15;
  for (const token of text.split(/\s+/).filter(Boolean)) {
    words.push({ text: token, at });
    for (const sound of soundsOf(token)) {
      const len = (0.15 + 0.03 * (seed(sound) % 3)) * pace;
      syllables.push({ sound, at, len: len * 1.15, open: OPEN[sound.at(-1) ?? 'a'] * 0.9 });
      at += len;
    }
    at += (/[.!?…]$/.test(token) ? 0.42 : /[,;:]$/.test(token) ? 0.22 : 0.05) * pace;
  }
  return { syllables, words, length: at };
}
