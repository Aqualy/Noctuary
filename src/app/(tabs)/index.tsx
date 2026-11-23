import { useClock } from '@shopify/react-native-skia';
import { useIsFocused } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { useSession } from '../../auth/SessionProvider';
import { useChat } from '../../chat/useChat';
import { Button } from '../../components/Button';
import { ChatSheet } from '../../components/ChatSheet';
import { MoonStatus } from '../../components/MoonStatus';
import { MoonPrintCanvas } from '../../moon/MoonPrintCanvas';
import { useMoonTouch } from '../../moon/useMoonTouch';
import { useSlowPhone } from '../../moon/useSlowPhone';
import { useChart } from '../../profile/useChart';
import { useSharedMoon } from '../../sky/MoonProvider';
import { sunVector, trueTurn } from '../../sky/pose';
import { colors, fonts } from '../../theme';
import { useVoice } from '../../voice/useVoice';

export default function MoonScreen() {
  const { session } = useSession();
  return session ? <Night userId={session.user.id} /> : null;
}

function Night({ userId }: { userId: string }) {
  const { moon, source, loading, failed, refresh, place } = useSharedMoon();
  const { signs } = useChart();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [chatting, setChatting] = useState(false);

  const focused = useIsFocused(); // no drawing behind another tab
  const slow = useSlowPhone();
  const clock = useClock();
  // perigee about 356,500 km, apogee about 406,700 km
  const near = Math.max(0, Math.min(1, (406700 - moon.distanceKm) / 50200));
  const { speech, subtitle, mood, say, stop, muted, toggleMute } = useVoice(clock, 0.6 + 0.4 * near);
  const chat = useChat({ userId, moon, place, signs, onSpeech: say });

  const truth = useSharedValue<number[]>(trueTurn(moon));
  const { gesture, drag, noticing, notice } = useMoonTouch(size);
  const gaze = useSharedValue<number[]>([0, 0]); // straight ahead
  const turn = useDerivedValue(() => {
    const t = truth.get();
    const d = drag.get();
    return [t[0] + d[0], t[1] + d[1], t[2]];
  });

  // leaving the tab ends the sentence
  useEffect(() => {
    if (!focused) stop();
  }, [focused, stop]);

  useEffect(() => {
    truth.set(trueTurn(moon));
  }, [moon, truth]);

  const sun = useMemo(() => sunVector(moon), [moon]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const face = mood ?? (chat.thinking ? 'stern' : noticing ? 'wonder' : 'calm');
  const canvas = { turn, gaze, speech, clock, sun, mood: face, ...size };

  return (
    <View style={styles.fill}>
      <GestureDetector gesture={gesture}>
        <View
          style={styles.moon}
          onLayout={onLayout}
          accessible
          accessibilityRole="imagebutton"
          accessibilityHint="The Moon notices you"
          onAccessibilityTap={notice}
          accessibilityLabel={`The Moon, ${moon.phaseName}, ${Math.round(moon.illumination)} percent lit`}
        >
          {focused && size.width > 0 && size.height > 0 && <MoonPrintCanvas {...canvas} lowQuality={slow} />}
        </View>
      </GestureDetector>
      {subtitle !== '' && <Text style={styles.subtitle}>{subtitle}</Text>}
      {chatting ? (
        <View style={styles.chat}>
          <ChatSheet
            chat={chat}
            muted={muted}
            onMute={toggleMute}
            onClose={() => {
              setChatting(false);
              stop();
            }}
          />
        </View>
      ) : (
        <>
          <MoonStatus moon={moon} source={source} place={place} loading={loading} failed={failed} onRetry={refresh} />
          <Button label="Ask the Moon" onPress={() => setChatting(true)} mark="→" />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.paper },
  moon: { flex: 1, minHeight: 120 },
  subtitle: { color: colors.ink, fontFamily: fonts.body, fontSize: 27, lineHeight: 30, textAlign: 'center', paddingHorizontal: 18, paddingBottom: 10 },
  chat: { flex: 1.1 },
});
