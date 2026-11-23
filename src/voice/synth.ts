// Puts recorded syllables one after another into a single WAV. No device code, so it can be tested anywhere.
import type { Mood } from '../moon/moonAnim';
import { SOUNDS, type Utterance } from './lexicon';

const SLOT = 0.4; // seconds per syllable in the bank

export type Bank = { rate: number; samples: Int16Array };

// Reads 16-bit mono PCM; looks for the chunks instead of assuming a 44-byte header.
export function readWav(bytes: Uint8Array): Bank {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const tag = (at: number) => String.fromCharCode(bytes[at], bytes[at + 1], bytes[at + 2], bytes[at + 3]);
  if (tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('not a WAV file');
  let rate = 0;
  for (let at = 12; at + 8 <= bytes.byteLength; ) {
    const size = view.getUint32(at + 4, true);
    if (tag(at) === 'fmt ') {
      if (view.getUint16(at + 8, true) !== 1 || view.getUint16(at + 10, true) !== 1 || view.getUint16(at + 22, true) !== 16) throw new Error('needs 16-bit mono');
      rate = view.getUint32(at + 12, true);
    }
    if (tag(at) === 'data') {
      const samples = new Int16Array(Math.floor(Math.min(size, bytes.byteLength - at - 8) / 2));
      for (let i = 0; i < samples.length; i++) samples[i] = view.getInt16(at + 8 + i * 2, true);
      return { rate, samples };
    }
    at += 8 + size + (size % 2);
  }
  throw new Error('no sound in the WAV file');
}

const PITCH: Record<Mood, number> = { calm: 1, joy: 1.1, sorrow: 0.88, stern: 0.92, wonder: 1.06 };

// volume 0..1; the pitch drifts a little per syllable so the voice does not sound like a machine
export function speak(bank: Bank, utterance: Utterance, mood: Mood, volume = 1): Uint8Array {
  const { rate, samples } = bank;
  const slot = Math.round(SLOT * rate);
  const mix = new Float32Array(Math.ceil((utterance.length + 0.5) * rate));
  utterance.syllables.forEach((s, n) => {
    const from = SOUNDS.indexOf(s.sound) * slot;
    if (from < 0) return;
    const pitch = PITCH[mood] * (1 + 0.035 * Math.sin(n * 1.7));
    const start = Math.round(s.at * rate);
    const length = Math.min(Math.floor((slot - 1) / pitch), Math.round(s.len * 1.5 * rate));
    const fade = Math.min(length, Math.round(0.06 * rate));
    for (let i = 0; i < length && start + i < mix.length; i++) {
      const p = i * pitch;
      const k = Math.floor(p);
      const a = samples[from + k] ?? 0;
      const b = samples[from + k + 1] ?? 0;
      mix[start + i] += (a + (b - a) * (p - k)) * 0.8 * Math.min(1, (length - i) / fade);
    }
  });
  const bytes = new Uint8Array(44 + mix.length * 2);
  const view = new DataView(bytes.buffer);
  const text = (at: number, t: string) => [...t].forEach((c, i) => view.setUint8(at + i, c.charCodeAt(0)));
  text(0, 'RIFF'); view.setUint32(4, 36 + mix.length * 2, true); text(8, 'WAVEfmt ');
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true);
  view.setUint32(24, rate, true); view.setUint32(28, rate * 2, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true);
  text(36, 'data'); view.setUint32(40, mix.length * 2, true);
  for (let i = 0; i < mix.length; i++) view.setInt16(44 + i * 2, Math.max(-32768, Math.min(32767, Math.round(mix[i] * volume))), true);
  return bytes;
}
