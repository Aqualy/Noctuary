// How the Moon reacts to fingers: dragging turns the head, a tap makes it notice you.
import { useCallback, useEffect, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const NOTICE_MS = 2200;

export function useMoonTouch(size: { width: number; height: number }) {
  const { width, height } = size;
  const drag = useSharedValue<number[]>([0, 0]);
  const [noticing, setNoticing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const notice = useCallback(() => {
    clearTimeout(timer.current);
    setNoticing(true);
    timer.current = setTimeout(() => setNoticing(false), NOTICE_MS);
  }, []);

  // Small turns only: near-profile views squash the nose.
  const pan = Gesture.Pan()
    .onUpdate((e) => {
      drag.set([
        Math.max(-0.6, Math.min(0.6, e.translationX / 250)),
        Math.max(-0.4, Math.min(0.4, e.translationY / 250)),
      ]);
    })
    .onFinalize(() => {
      drag.set(withSpring([0, 0]));
    });

  const tap = Gesture.Tap().onEnd((e, success) => {
    const onMoon = Math.hypot(e.x - width / 2, e.y - height / 2) < 0.43 * Math.min(width, height);
    if (success && onMoon) scheduleOnRN(notice);
  });

  return { gesture: Gesture.Simultaneous(pan, tap), drag, noticing, notice };
}
