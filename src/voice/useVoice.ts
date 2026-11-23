// Makes the Moon speak: mouth, mood and subtitles from one schedule.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';
import type { Mood, Syllable } from '../moon/moonAnim';
import { utter } from './lexicon';

const STAY_MS = 5000; // the last words remain readable

export function useVoice(clock: SharedValue<number>) {
  const speech = useSharedValue<{ start: number; list: Syllable[] }>({ start: 0, list: [] });
  const [subtitle, setSubtitle] = useState('');
  const [mood, setMood] = useState<Mood | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stop = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    speech.set({ start: 0, list: [] });
    setSubtitle('');
    setMood(null);
  }, [speech]);

  const say = useCallback((text: string, nextMood: Mood) => {
    stop();
    const { syllables, words, length } = utter(text, nextMood);
    setMood(nextMood);
    speech.set({ start: clock.get(), list: syllables.map(({ at, len, open }) => ({ at, len, open })) });
    // subtitles word by word, one sentence at a time
    let sentence = '';
    let fresh = true;
    for (const word of words) {
      sentence = fresh ? word.text : `${sentence} ${word.text}`;
      fresh = /[.!?…]["'”’)]*$/.test(word.text);
      const shown = sentence;
      timers.current.push(setTimeout(() => setSubtitle(shown), word.at * 1000));
    }
    timers.current.push(setTimeout(stop, length * 1000 + STAY_MS));
  }, [clock, speech, stop]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  return { speech, subtitle, mood, say, stop };
}
