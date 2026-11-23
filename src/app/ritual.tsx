// First visit: the Moon asks, one thing at a time. Scripted, and every question can be skipped.
import { useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { GateMoon } from '../components/GateMoon';
import { MomentPicker } from '../components/MomentPicker';
import { PlacePicker } from '../components/PlacePicker';
import type { Mood } from '../moon/moonAnim';
import { fromDay, fromTime, toDay, toTime } from '../profile/dates';
import type { FoundPlace } from '../profile/places';
import { useProfile, type Answers } from '../profile/ProfileProvider';
import { colors, fonts } from '../theme';

type Step = 'name' | 'date' | 'time' | 'place' | 'done';
const STEPS: Step[] = ['name', 'date', 'time', 'place', 'done'];

const LINES: Record<Step, { mood: Mood; text: string }> = {
  name: { mood: 'wonder', text: 'You woke me. Few look up long enough. What shall I call you?' },
  date: { mood: 'calm', text: 'On which day did you first breathe under me?' },
  time: { mood: 'calm', text: 'At what hour? The clock of the place where you were born.' },
  place: { mood: 'calm', text: 'And where on your Earth was that?' },
  done: { mood: 'joy', text: 'Then I know where to look for you. Come, the night is open.' },
};

export default function Ritual() {
  const { answers: known, save, later } = useProfile();
  const [step, setStep] = useState<Step>('name');
  const [awake, setAwake] = useState(false);
  const [name, setName] = useState(known?.name ?? '');
  const [date, setDate] = useState(() => fromDay(known?.birth_date ?? '2000-01-01'));
  const [time, setTime] = useState(() => fromTime(known?.birth_time ?? '12:00'));
  const [place, setPlace] = useState<FoundPlace | null>(() =>
    known?.birth_place && known.lat !== null && known.lon !== null && known.tz
      ? { id: 0, label: known.birth_place, lat: known.lat, lon: known.lon, tz: known.tz }
      : null,
  );
  const [given, setGiven] = useState({ date: Boolean(known?.birth_date), time: Boolean(known?.birth_time) });
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  // The Moon opens its eyes.
  useEffect(() => {
    const timer = setTimeout(() => setAwake(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const index = STEPS.indexOf(step);
  const go = (to: number) => {
    Keyboard.dismiss();
    setFailed(false);
    setStep(STEPS[to]);
  };
  const next = () => {
    if (step === 'date' || step === 'time') setGiven({ ...given, [step]: true });
    go(index + 1);
  };
  const skip = () => {
    if (step === 'name') setName('');
    if (step === 'date' || step === 'time') setGiven({ ...given, [step]: false });
    if (step === 'place') setPlace(null);
    go(index + 1);
  };

  const finish = async () => {
    const answers: Answers = {
      name: name.trim() || null,
      birth_date: given.date ? toDay(date) : null,
      birth_time: given.time ? toTime(time) : null,
      birth_place: place?.label ?? null,
      lat: place?.lat ?? null,
      lon: place?.lon ?? null,
      tz: place?.tz ?? null,
    };
    setBusy(true);
    setFailed(false);
    const ok = await save(answers).catch(() => false);
    setBusy(false);
    setFailed(!ok); // when saved, the Moon screen replaces this one
  };

  const line = LINES[step];
  const ready = step === 'name' ? name.trim().length > 0 : step === 'place' ? place !== null : true;

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.moon}>
          <GateMoon mood={awake ? line.mood : 'asleep'} sun={SUN} />
        </View>
        <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.line} accessibilityLiveRegion="polite">{line.text}</Text>

          {step === 'name' && (
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.parchment}
              accessibilityLabel="Your name"
              autoComplete="given-name"
              textContentType="givenName"
              autoCapitalize="words"
              maxLength={40}
              returnKeyType="next"
              onSubmitEditing={() => ready && next()}
            />
          )}
          {step === 'date' && <MomentPicker mode="date" value={date} onChange={setDate} />}
          {step === 'time' && <MomentPicker mode="time" value={time} onChange={setTime} />}
          {step === 'place' && <PlacePicker value={place} onChange={setPlace} />}

          {failed && <Text style={styles.error} accessibilityRole="alert">The Moon could not remember this. Check your connection.</Text>}
          {step === 'done' ? (
            <>
              <Button label={failed ? 'Try again' : 'Enter the night'} onPress={finish} busy={busy} />
              {failed && <Button label="Continue, ask me next time" onPress={later} disabled={busy} plain />}
            </>
          ) : (
            <>
              <Button label="Continue" onPress={next} disabled={!ready} />
              <Button label={step === 'time' ? 'I do not know' : 'Skip'} onPress={skip} plain />
            </>
          )}
          {known && step === 'name' && <Button label="Leave it as it was" onPress={later} plain />}
          {index > 0 && <Button label="Back" onPress={() => go(index - 1)} disabled={busy} plain />}
          {step === 'name' && <Text style={styles.note}>Your answers are kept in your account. Other users cannot see them, and you can skip any question.</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SUN: [number, number, number] = [0.5, 0.3, 0.81];

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  fill: { flex: 1 },
  moon: { flex: 1, minHeight: 120 },
  sheet: { flexGrow: 0, flexShrink: 1, borderTopWidth: 1, borderColor: colors.brass },
  content: { padding: 16, gap: 12 },
  line: { color: colors.bone, fontFamily: fonts.voice, fontSize: 25, lineHeight: 30 },
  note: { color: colors.parchment, fontFamily: fonts.body, fontSize: 16 },
  error: { color: colors.warning, fontFamily: fonts.body, fontSize: 16 },
  input: {
    minHeight: 48, paddingHorizontal: 12, color: colors.bone, fontFamily: fonts.body, fontSize: 18,
    borderWidth: 1, borderColor: colors.brass, backgroundColor: colors.moss,
  },
});
