import { useClock } from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../auth/SessionProvider';
import { useChat } from '../chat/useChat';
import { Button } from '../components/Button';
import { ChatSheet } from '../components/ChatSheet';
import { MoonStatus } from '../components/MoonStatus';
import { SaveNight } from '../components/SaveNight';
import { SignOut } from '../components/SignOut';
import { MoonPixelCanvas } from '../moon/MoonPixelCanvas';
import { useMoonTouch } from '../moon/useMoonTouch';
import { sunVector, trueTurn } from '../sky/pose';
import type { Place } from '../sky/types';
import { useMoon } from '../sky/useMoon';
import { colors } from '../theme';
import { useVoice } from '../voice/useVoice';

const PLACE: Place = { name: 'Antwerp', lat: 51.22, lon: 4.4 }; // until the user can choose a city
const NO_SIGNS = {};

export default function MoonScreen() {
  const { session } = useSession();
  return session ? <Night userId={session.user.id} /> : null;
}

function Night({ userId }: { userId: string }) {
  const { moon, source, loading, failed, refresh } = useMoon(PLACE);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [chatting, setChatting] = useState(false);

  const clock = useClock();
  // perigee about 356,500 km, apogee about 406,700 km
  const near = Math.max(0, Math.min(1, (406700 - moon.distanceKm) / 50200));
  const { speech, subtitle, mood, say, stop, muted, toggleMute } = useVoice(clock, 0.6 + 0.4 * near);
  const chat = useChat({ userId, moon, place: PLACE, signs: NO_SIGNS, onSpeech: say });

  const truth = useSharedValue<number[]>(trueTurn(moon));
  const { gesture, drag, noticing, notice } = useMoonTouch(size);
  const gaze = useSharedValue<number[]>([0, 0]); // straight ahead
  const turn = useDerivedValue(() => {
    const t = truth.get();
    const d = drag.get();
    return [t[0] + d[0], t[1] + d[1], t[2]];
  });

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
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {!chatting && <SignOut />}
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
            {size.width > 0 && size.height > 0 && <MoonPixelCanvas {...canvas} />}
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
            <MoonStatus moon={moon} source={source} place={PLACE} loading={loading} failed={failed} onRetry={refresh} />
            <View style={styles.actions}>
              <Button label="Ask the Moon" onPress={() => setChatting(true)} />
            </View>
            <SaveNight moon={moon} userId={userId} />
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  fill: { flex: 1 },
  moon: { flex: 1, minHeight: 120 },
  subtitle: { color: colors.bone, fontSize: 20, lineHeight: 28, textAlign: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  chat: { flex: 1.3 },
  actions: { paddingHorizontal: 16, paddingBottom: 8 },
});
