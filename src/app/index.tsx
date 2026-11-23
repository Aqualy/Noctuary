import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MoonStatus } from '../components/MoonStatus';
import type { Syllable } from '../moon/moonAnim';
import { MoonPixelCanvas } from '../moon/MoonPixelCanvas';
import { sunVector, trueTurn } from '../sky/pose';
import type { Place } from '../sky/types';
import { useMoon } from '../sky/useMoon';
import { colors } from '../theme';

const PLACE: Place = { name: 'Antwerp', lat: 51.22, lon: 4.4 }; // until the user can choose a city

export default function MoonScreen() {
  const { moon, source, loading, failed, refresh } = useMoon(PLACE);
  const [size, setSize] = useState({ width: 0, height: 0 });

  const truth = useSharedValue<number[]>(trueTurn(moon));
  const drag = useSharedValue<number[]>([0, 0]);
  const gaze = useSharedValue<number[]>([0, 0]);
  const speech = useSharedValue<{ start: number; list: Syllable[] }>({ start: 0, list: [] });
  const turn = useDerivedValue(() => {
    const t = truth.get();
    const d = drag.get();
    return [t[0] + d[0], t[1] + d[1], t[2]];
  });

  useEffect(() => {
    truth.set(trueTurn(moon));
  }, [moon, truth]);

  const sun = useMemo(() => sunVector(moon), [moon]);

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

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const canvas = { turn, gaze, speech, sun, mood: 'calm' as const, ...size };

  return (
    <SafeAreaView style={styles.screen}>
      <GestureDetector gesture={pan}>
        <View
          style={styles.moon}
          onLayout={onLayout}
          accessible
          accessibilityRole="image"
          accessibilityLabel={`The Moon, ${moon.phaseName}, ${Math.round(moon.illumination)} percent lit`}
        >
          {size.width > 0 && <MoonPixelCanvas {...canvas} />}
        </View>
      </GestureDetector>
      <MoonStatus moon={moon} source={source} place={PLACE} loading={loading} failed={failed} onRetry={refresh} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  moon: { flex: 1 },
});
