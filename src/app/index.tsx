// Temporary test screen for plan step A2: does the Moon run well on a real phone?
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FrameRate } from '../components/FrameRate';
import type { Mood, Syllable } from '../moon/moonAnim';
import { MoonCanvas } from '../moon/MoonCanvas';
import { MoonPixelCanvas } from '../moon/MoonPixelCanvas';

const RENDERERS = ['none', 'smooth low', 'pixel', 'smooth'] as const;
const MOODS: Mood[] = ['calm', 'joy', 'sorrow', 'stern', 'wonder'];
const SUNS = [30, 0, 90, 150, -90].map((deg) => {
  const a = (deg * Math.PI) / 180;
  return { label: `${deg}°`, vector: [Math.sin(a), 0, Math.cos(a)] as [number, number, number] };
});

type ChoiceProps = { label: string; value: string; onPress: () => void };

function Choice({ label, value, onPress }: ChoiceProps) {
  return (
    <Pressable style={styles.choice} onPress={onPress} accessibilityRole="button">
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </Pressable>
  );
}

export default function MoonTest() {
  const [renderer, setRenderer] = useState(0);
  const [mood, setMood] = useState(0);
  const [sun, setSun] = useState(0);
  const turn = useSharedValue<number[]>([0, 0, 0]);
  const gaze = useSharedValue<number[]>([0, 0]);
  const speech = useSharedValue<{ start: number; list: Syllable[] }>({ start: 0, list: [] });

  // Small turns only: near-profile views squash the nose.
  const drag = Gesture.Pan()
    .onUpdate((e) => {
      turn.set([
        Math.max(-0.6, Math.min(0.6, e.translationX / 250)),
        Math.max(-0.4, Math.min(0.4, e.translationY / 250)),
        0,
      ]);
    })
    .onFinalize(() => {
      turn.set(withSpring([0, 0, 0]));
    });

  const name = RENDERERS[renderer];
  const props = { turn, gaze, speech, mood: MOODS[mood], sun: SUNS[sun].vector };

  return (
    <View style={styles.screen}>
      <GestureDetector gesture={drag}>
        <View style={StyleSheet.absoluteFill}>
          {name === 'pixel' && <MoonPixelCanvas {...props} />}
          {name.startsWith('smooth') && <MoonCanvas key={name} {...props} lowQuality={name === 'smooth low'} />}
        </View>
      </GestureDetector>
      <SafeAreaView style={styles.overlay} pointerEvents="box-none">
        <FrameRate />
        <View style={styles.row}>
          <Choice label="Renderer" value={name} onPress={() => setRenderer((renderer + 1) % RENDERERS.length)} />
          <Choice label="Mood" value={MOODS[mood]} onPress={() => setMood((mood + 1) % MOODS.length)} />
          <Choice label="Sun" value={SUNS[sun].label} onPress={() => setSun((sun + 1) % SUNS.length)} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0E120D' },
  overlay: { flex: 1, justifyContent: 'space-between', padding: 16 },
  row: { flexDirection: 'row', gap: 8 },
  choice: { flex: 1, minHeight: 56, padding: 8, borderWidth: 1, borderColor: '#A58B4F', backgroundColor: '#2C3A24' },
  label: { color: '#E6DCC3', fontSize: 16 },
  value: { color: '#F4EEDD', fontSize: 16, fontWeight: '600' },
});
