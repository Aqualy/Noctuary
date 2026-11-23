// True once the phone cannot keep up: three seconds in a row under 24 frames. It stays true until the app restarts.
import { useState } from 'react';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

export function useSlowPhone(): boolean {
  const [slow, setSlow] = useState(false);
  const start = useSharedValue(0);
  const frames = useSharedValue(0);
  const bad = useSharedValue(0);

  useFrameCallback(({ timestamp, timeSincePreviousFrame }) => {
    if (bad.get() >= 3) return;
    // a pause (app in the background) is not a slow phone
    if (start.get() === 0 || (timeSincePreviousFrame ?? 0) > 500) {
      start.set(timestamp);
      frames.set(0);
      return;
    }
    frames.set(frames.get() + 1);
    const elapsed = timestamp - start.get();
    if (elapsed < 1000) return;
    bad.set((frames.get() * 1000) / elapsed < 24 ? bad.get() + 1 : 0);
    if (bad.get() >= 3) scheduleOnRN(setSlow, true);
    start.set(timestamp);
    frames.set(0);
  });

  return slow;
}
