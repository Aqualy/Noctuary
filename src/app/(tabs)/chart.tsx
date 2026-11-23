import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../auth/SessionProvider';
import { Button } from '../../components/Button';
import { ChartWheel, plain, PLANET_GLYPHS } from '../../components/ChartWheel';
import { Caption, Fact, Section, Words } from '../../components/Section';
import { useProfile } from '../../profile/ProfileProvider';
import { useChart } from '../../profile/useChart';
import { useReading } from '../../profile/useReading';
import { signOf, type Chart } from '../../sky/chart';
import { day } from '../../sky/when';
import { colors, fonts } from '../../theme';

export default function ChartScreen() {
  const { session } = useSession();
  const { answers, askAgain } = useProfile();
  const { chart, hash } = useChart();
  const router = useRouter();
  if (!session) return null;

  const about = [answers?.name, answers?.birth_date ? day(answers.birth_date) : null, answers?.birth_place?.split(',')[0]].filter(Boolean).join(', ');
  return (
    <ScrollView style={styles.screen}>
      <Caption text={chart ? about : 'Chart'} />
      {chart ? (
        <Filled chart={chart} hash={hash} userId={session.user.id} />
      ) : (
        <Words>The Moon does not know your birth date yet, so there is no chart to draw.</Words>
      )}
      <Button label={chart ? 'Change birth details' : 'Tell the Moon'} onPress={askAgain} mark="→" />
      <Button label="What the Moon remembers" onPress={() => router.push('/memory')} mark="→" />
      <View style={styles.end} />
    </ScrollView>
  );
}

function Filled({ chart, hash, userId }: { chart: Chart; hash: string; userId: string }) {
  const [width, setWidth] = useState(0);
  const { reading, outdated, status, busy, message, load, make } = useReading(userId, chart, hash);
  const unsure = chart.planets.filter((p) => !p.certain).map((p) => p.name);
  const placed = (name: string) => {
    const p = chart.planets.find((x) => x.name === name);
    return p ? `${p.certain ? p.sign : `${p.sign}?`}${p.house === null ? '' : `, house ${p.house}`}` : '';
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <View style={styles.wheel}>{width > 0 && <ChartWheel chart={chart} size={Math.min(width - 28, 380)} />}</View>
      {chart.ascendant !== null && (
        <View style={styles.columns}>
          <View style={styles.left}>
            <Caption text="Rising" />
            <Text style={styles.rising}>{signOf(chart.ascendant)}</Text>
          </View>
          <View style={styles.right}>
            <Caption text="Sun, Moon" />
            <Fact>{placed('Sun')}</Fact>
            <Fact>{placed('Moon')}</Fact>
          </View>
        </View>
      )}
      <Section title="Reading">
        {status === 'loading' && <Words dim>Looking for your reading…</Words>}
        {status === 'error' && (
          <>
            <Words>Your reading could not be loaded.</Words>
            <Button label="Try again" onPress={load} />
          </>
        )}
        {reading && <Words>{reading.text}</Words>}
        {outdated && <Words dim>This was read from your earlier birth details.</Words>}
        {message && <Words alarm>{message}</Words>}
        {status === 'ready' && (!reading || outdated) && (
          <>
            <Button label={busy ? 'The Moon is reading' : 'Read my chart'} onPress={make} busy={busy} mark="→" />
            <Words dim>Made by an AI service (Groq) from your signs and houses, never from your birth date or place. It costs one question.</Words>
          </>
        )}
        <Words dim>Astrology is symbolic. It does not predict anything.</Words>
      </Section>
      <Section title="All placements">
        {chart.ascendant !== null && <Fact>Rising: {signOf(chart.ascendant)}</Fact>}
        {chart.planets.map((p) => (
          <View key={p.name} style={styles.row}>
            <Text style={styles.glyph}>{plain(PLANET_GLYPHS[p.name] ?? '')}</Text>
            <Text style={styles.name}>{p.name}</Text>
            <Text style={styles.name}>{placed(p.name)}</Text>
          </View>
        ))}
        {chart.ascendant === null && (
          <Words dim>No rising sign or houses: they need a birth time and place.{unsure.length ? ` Uncertain without them: ${unsure.join(', ')}.` : ''}</Words>
        )}
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  wheel: { paddingVertical: 14 },
  columns: { flexDirection: 'row' },
  left: { flex: 1 },
  right: { flex: 1.1, borderLeftWidth: 2, borderColor: colors.line },
  rising: { color: colors.ink, fontFamily: fonts.title, fontSize: 34, paddingHorizontal: 14, paddingVertical: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, minHeight: 30 },
  glyph: { color: colors.ink, fontSize: 18, width: 24 },
  name: { color: colors.ink, fontFamily: fonts.body, fontSize: 21, flex: 1 },
  end: { height: 24 },
});
