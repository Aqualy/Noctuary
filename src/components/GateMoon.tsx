// The sleeping Moon in the dark, behind the login.
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import type { Syllable } from '../moon/moonAnim';
import { MoonPixelCanvas } from '../moon/MoonPixelCanvas';

const SUN: [number, number, number] = [0.62, 0.2, -0.76]; // a thin crescent

export function GateMoon() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const turn = useSharedValue<number[]>([0, 0, 0]);
  const gaze = useSharedValue<number[]>([0, 0]);
  const speech = useSharedValue<{ start: number; list: Syllable[] }>({ start: 0, list: [] });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={styles.fill} onLayout={onLayout} accessible={false} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
      {size.width > 0 && size.height > 0 && (
        <MoonPixelCanvas turn={turn} gaze={gaze} speech={speech} sun={SUN} mood="asleep" width={size.width} height={size.height} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({ fill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } });
