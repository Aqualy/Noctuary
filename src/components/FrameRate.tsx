import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

// UI-thread frames per second, updated once a second.
export function FrameRate() {
  const [fps, setFps] = useState(0);
  const start = useSharedValue(0);
  const count = useSharedValue(0);

  useFrameCallback(({ timestamp }) => {
    if (start.get() === 0) start.set(timestamp);
    count.set(count.get() + 1);
    const elapsed = timestamp - start.get();
    if (elapsed < 1000) return;
    scheduleOnRN(setFps, Math.round((count.get() * 1000) / elapsed));
    start.set(timestamp);
    count.set(0);
  });

  return <Text style={styles.text}>{fps} fps</Text>;
}

const styles = StyleSheet.create({
  text: { color: '#F4EEDD', fontSize: 16, fontVariant: ['tabular-nums'] },
});
