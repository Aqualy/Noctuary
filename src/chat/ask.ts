import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';
import type { Mood } from '../moon/moonAnim';
import type { MoonState, Place } from '../sky/types';

export type Signs = { sun?: string; moon?: string; rising?: string };
export type Answer = { ok: true; speech: string; mood: Mood } | { ok: false; message: string; phrase: string };

// Spoken by the phone itself when the Moon cannot answer.
const PHRASES = [
  'Stone rests too. Look up instead; I am no less there when I am silent.',
  'Ask me later. I have been turning for four billion years, I can wait.',
  'Tonight I only shine. It is most of what I do.',
];

function tired(reason: string | undefined): string {
  if (reason === 'user' || reason === 'everyone') {
    const reset = new Date();
    reset.setUTCHours(24, 0, 0, 0); // the count starts again at midnight UTC
    const at = `${String(reset.getHours()).padStart(2, '0')}:${String(reset.getMinutes()).padStart(2, '0')}`;
    return reason === 'user' ? `You asked all your questions for today. The Moon answers again after ${at}.` : `The Moon is tired: many people asked today. Try again after ${at}.`;
  }
  if (reason === 'busy') return 'The Moon is catching its breath. Try again in a minute.';
  return 'The Moon is tired and cannot answer now. Try again later.';
}

const phrase = () => PHRASES[Math.floor(Math.random() * PHRASES.length)];

async function call(body: object): Promise<Answer> {
  const { data, error } = await supabase.functions.invoke('speak', { body });
  if (!error && typeof data?.speech === 'string') return { ok: true, speech: data.speech, mood: data.mood };
  if (error instanceof FunctionsHttpError) {
    const answer = await error.context.json().catch(() => null);
    if (error.context.status === 401) return { ok: false, message: 'Your login has expired. Sign out and log in again.', phrase: phrase() };
    return { ok: false, message: tired(answer?.reason), phrase: phrase() };
  }
  return { ok: false, message: 'No connection. The Moon cannot hear you.', phrase: phrase() };
}

export const ask = (text: string, moon: MoonState, place: Place, signs: Signs): Promise<Answer> =>
  call({
    text,
    signs,
    sky: {
      phase: moon.phaseName, illumination: moon.illumination, altitude: moon.altitude,
      compass: moon.compass, distanceKm: moon.distanceKm, place: place.name,
    },
  });

export type Placement = { body: string; sign: string; house: number | null };

export const readTheChart = (placements: Placement[], rising: string | null, hash: string): Promise<Answer> =>
  call({ kind: 'reading', placements, rising, hash });
