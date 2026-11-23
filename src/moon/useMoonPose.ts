// Mood easing, speech, blinking and Reduce Motion, shared by MoonCanvas and MoonPixelCanvas.
import { useEffect } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useClock } from '@shopify/react-native-skia';
import { Easing, useDerivedValue, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import { ASLEEP, easeFace, FACES, jawAt, pose, type Mood, type Syllable } from './moonAnim';

export type PoseProps = {
  turn: SharedValue<number[]>; // yaw, pitch, roll
  gaze: SharedValue<number[]>;
  mood: Mood | 'asleep';
  speech: SharedValue<{ start: number; list: Syllable[] }>; // start: clock value (ms) when the audio began
  clock?: SharedValue<number>;
};

export function useMoonPose({ turn, gaze, mood, speech, clock }: PoseProps) {
  const ownClock = useClock();
  const time = clock ?? ownClock;
  const from = useSharedValue(ASLEEP);
  const to = useSharedValue(ASLEEP);
  const mix = useSharedValue(1);
  const still = useSharedValue(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { still.value = v; });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (v) => { still.value = v; });
    return () => sub.remove();
  }, [still]);

  useEffect(() => {
    from.value = easeFace(from.value, to.value, mix.value);
    to.value = mood === 'asleep' ? ASLEEP : FACES[mood];
    mix.value = 0;
    mix.value = withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) });
  }, [mood, from, to, mix]);

  return useDerivedValue(() => pose({
    time: time.value / 1000,
    face: easeFace(from.value, to.value, mix.value),
    jaw: jawAt(speech.value.list, (time.value - speech.value.start) / 1000),
    gaze: gaze.value,
    turn: turn.value,
    still: still.value,
  }));
}
