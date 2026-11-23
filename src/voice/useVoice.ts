// Makes the Moon speak: sound, mouth, mood and subtitles from one schedule.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Mood, Syllable } from '../moon/moonAnim';
import { utter } from './lexicon';
import { hush, play } from './player';

const STAY_MS = 5000; // the last words remain readable
const MUTED = 'voice:muted';

// volume 0..1: the nearer the Moon, the louder
export function useVoice(clock: SharedValue<number>, volume: number) {
  const speech = useSharedValue<{ start: number; list: Syllable[] }>({ start: 0, list: [] });
  const [subtitle, setSubtitle] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const [muted, setMuted] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const turn = useRef(0);
  const done = useRef<(() => void) | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(MUTED).then((v) => setMuted(v === 'yes')).catch(() => {});
  }, []);

  const stop = useCallback(() => {
    turn.current++;
    timers.current.forEach(clearTimeout);
    timers.current = [];
    done.current?.();
    done.current = null;
    hush();
    speech.set({ start: 0, list: [] });
    setSubtitle('');
    setMood(null);
  }, [speech]);

  const toggleMute = useCallback(() => {
    if (!muted) hush();
    setMuted(!muted);
    AsyncStorage.setItem(MUTED, muted ? 'no' : 'yes').catch(() => {});
  }, [muted]);

  // Resolves when the last word has been spoken, or when something else interrupts it.
  const say = useCallback(async (text: string, nextMood: Mood): Promise<void> => {
    stop();
    const mine = ++turn.current;
    const utterance = utter(text, nextMood);
    setMood(nextMood);
    if (!muted) await play(utterance, nextMood, volume).catch(() => {});
    if (mine !== turn.current) return;

    speech.set({ start: clock.get(), list: utterance.syllables.map(({ at, len, open }) => ({ at, len, open })) });
    // subtitles word by word, one sentence at a time
    let sentence = '';
    let fresh = true;
    for (const word of utterance.words) {
      sentence = fresh ? word.text : `${sentence} ${word.text}`;
      fresh = /[.!?…]["'”’)]*$/.test(word.text);
      const shown = sentence;
      timers.current.push(setTimeout(() => setSubtitle(shown), word.at * 1000));
    }
    timers.current.push(setTimeout(stop, utterance.length * 1000 + STAY_MS));
    await new Promise<void>((resolve) => {
      done.current = resolve;
      timers.current.push(setTimeout(resolve, utterance.length * 1000));
    });
  }, [clock, muted, speech, stop, volume]);

  useEffect(() => {
    const mine = timers;
    return () => {
      mine.current.forEach(clearTimeout);
      hush();
    };
  }, []);

  return { speech, subtitle, mood, say, stop, muted, toggleMute };
}
