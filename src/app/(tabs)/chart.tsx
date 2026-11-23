import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../auth/SessionProvider';
import { Button } from '../../components/Button';
import { ChartWheel, plain, PLANET_GLYPHS } from '../../components/ChartWheel';
import { Section } from '../../components/Section';
import { useProfile } from '../../profile/ProfileProvider';
import { useChart } from '../../profile/useChart';
import { useReading } from '../../profile/useReading';
import { signOf, type Chart } from '../../sky/chart';
import { colors } from '../../theme';

export default function ChartScreen() {
  const { session } = useSession();
  const { askAgain } = useProfile();
  const { chart, hash } = useChart();
  const router = useRouter();
  if (!session) return null;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title} accessibilityRole="header">Chart</Text>
        {chart ? (
          <Filled chart={chart} hash={hash} userId={session.user.id} />
        ) : (
          <Text style={styles.text}>The Moon does not know your birth date yet, so there is no chart to draw.</Text>
        )}
        <Button label={chart ? 'Change birth details' : 'Tell the Moon'} onPress={askAgain} plain={chart !== null} />
        <Button label="What the Moon remembers" onPress={() => router.push('/memory')} plain />
      </ScrollView>
    </SafeAreaView>
  );
}

function Filled({ chart, hash, userId }: { chart: Chart; hash: string; userId: string }) {
  const { width } = useWindowDimensions();
  const { reading, outdated, status, busy, message, load, make } = useReading(userId, chart, hash);
  const unsure = chart.planets.filter((p) => !p.certain).map((p) => p.name);

  return (
    <>
      <ChartWheel chart={chart} size={Math.min(width - 32, 380)} />
      <Section title="Placements">
        {chart.ascendant !== null && <Text style={styles.text}>Rising: {signOf(chart.ascendant)}</Text>}
        {chart.planets.map((p) => (
          <View key={p.name} style={styles.row}>
            <Text style={styles.text}>{plain(PLANET_GLYPHS[p.name] ?? '')} {p.name}</Text>
            <Text style={styles.text}>{p.certain ? p.sign : `${p.sign}?`}{p.house === null ? '' : `, house ${p.house}`}</Text>
          </View>
        ))}
        {chart.ascendant === null && (
          <Text style={styles.note}>No rising sign or houses: they need a birth time and place.{unsure.length ? ` Uncertain without them: ${unsure.join(', ')}.` : ''}</Text>
        )}
      </Section>
      <Section title="Reading">
        {status === 'loading' && <Text style={styles.note}>Looking for your reading…</Text>}
        {status === 'error' && (
          <>
            <Text style={styles.text}>Your reading could not be loaded.</Text>
            <Button label="Try again" onPress={load} />
          </>
        )}
        {reading && <Text style={styles.text}>{reading.text}</Text>}
        {outdated && <Text style={styles.note}>This was read from your earlier birth details.</Text>}
        {message && <Text style={styles.error} accessibilityRole="alert">{message}</Text>}
        {status === 'ready' && (!reading || outdated) && (
          <>
            <Button label={busy ? 'The Moon is reading' : 'Read my chart'} onPress={make} busy={busy} />
            <Text style={styles.note}>Made by an AI service (Groq) from the signs and houses above, never from your birth date or place. It costs one question.</Text>
          </>
        )}
        <Text style={styles.note}>Astrology is symbolic. It does not predict anything.</Text>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  content: { padding: 16, gap: 16 },
  title: { color: colors.bone, fontSize: 32 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 },
  text: { color: colors.bone, fontSize: 18, lineHeight: 26, flexShrink: 1 },
  note: { color: colors.parchment, fontSize: 16, lineHeight: 23 },
  error: { color: colors.warning, fontSize: 16 },
});
