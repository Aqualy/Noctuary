import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../../auth/SessionProvider';
import { Button } from '../../components/Button';
import { Section } from '../../components/Section';
import { useNights, type Night } from '../../nights/useNights';
import { folkloreFor } from '../../sky/folklore';
import { useSharedMoon } from '../../sky/MoonProvider';
import { useEclipses } from '../../sky/useEclipses';
import { clockTime, day, dayTime } from '../../sky/when';
import { colors } from '../../theme';

export default function AlmanacScreen() {
  const { session } = useSession();
  return session ? <Almanac userId={session.user.id} /> : null;
}

function Almanac({ userId }: { userId: string }) {
  const { moon, source, failed, loading, place, refresh } = useSharedMoon();
  const { eclipses, failed: noEclipses, load: loadEclipses } = useEclipses();
  const { nights, tonight, failed: noNights, busy, message, load, save, remove } = useNights(userId);

  const head = (
    <View style={styles.head}>
      <Text style={styles.title} accessibilityRole="header">Almanac</Text>
      <Section title="Today">
        <Text style={styles.text}>{moon.rise ? `Rises ${clockTime(moon.rise)}` : 'Does not rise today'}</Text>
        <Text style={styles.text}>{moon.set ? `Sets ${clockTime(moon.set)}` : 'Does not set today'}</Text>
        <Text style={styles.note}>
          {place.name}, in the time of your phone.
          {source === 'calculated' ? ' Calculated on this phone.' : ''}
          {source === 'saved' ? ` Last seen at ${clockTime(moon.at)}.` : ''}
        </Text>
        {failed && <Button label="Retry" onPress={refresh} busy={loading} />}
      </Section>

      <Section title="Coming phases">
        {moon.next.map((p) => (
          <View key={p.at} style={styles.row}>
            <Text style={styles.text}>{p.name}</Text>
            <Text style={styles.text}>{dayTime(p.at)}</Text>
          </View>
        ))}
      </Section>

      <Section title="Eclipses">
        {noEclipses ? (
          <>
            <Text style={styles.text}>The eclipses could not be loaded.</Text>
            <Button label="Try again" onPress={loadEclipses} />
          </>
        ) : eclipses === null ? (
          <Text style={styles.note}>Looking ahead…</Text>
        ) : eclipses.length === 0 ? (
          <Text style={styles.text}>None known soon.</Text>
        ) : (
          eclipses.slice(0, 2).map((e) => (
            <View key={e.at}>
              <Text style={styles.text}>{e.label}</Text>
              <Text style={styles.note}>{dayTime(e.at)}</Text>
            </View>
          ))
        )}
        <Text style={styles.note}>Somewhere on Earth: not every eclipse can be seen from {place.name}.</Text>
      </Section>

      <Section title={`Told of the ${moon.phaseName}`}>
        <Text style={styles.text}>{folkloreFor(moon.phaseName)}</Text>
      </Section>

      <Section title="Your nights">
        {message && <Text style={styles.error} accessibilityRole="alert">{message}</Text>}
        {nights !== null && !tonight && <Button label="Save this night" onPress={() => save(moon)} busy={busy} />}
        {noNights && (
          <>
            <Text style={styles.text}>Your saved nights could not be loaded.</Text>
            <Button label="Try again" onPress={load} />
          </>
        )}
        {nights === null && !noNights && <ActivityIndicator color={colors.bone} />}
        {nights?.length === 0 && <Text style={styles.text}>No saved nights yet.</Text>}
      </Section>
    </View>
  );

  const row = ({ item }: { item: Night }) => {
    const name = item.id === tonight?.id ? 'Tonight' : day(item.local_date);
    return (
      <View style={styles.night}>
        <View style={styles.grow}>
          <Text style={styles.text}>{name}</Text>
          <Text style={styles.note}>{item.phase}, {Math.round(item.illumination)}% lit</Text>
        </View>
        <Pressable style={styles.remove} onPress={() => remove(item.id)} disabled={busy} accessibilityRole="button" accessibilityLabel={`Remove ${name}`}>
          <Text style={styles.note}>Remove</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
      <FlatList data={nights ?? []} keyExtractor={(n) => n.id} renderItem={row} ListHeaderComponent={head} contentContainerStyle={styles.list} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  list: { padding: 16 },
  head: { gap: 16 },
  title: { color: colors.bone, fontSize: 32 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 4 },
  text: { color: colors.bone, fontSize: 18, lineHeight: 26, flexShrink: 1 },
  note: { color: colors.parchment, fontSize: 16, lineHeight: 23 },
  error: { color: colors.warning, fontSize: 16 },
  night: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.moss },
  grow: { flex: 1 },
  remove: { minHeight: 48, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
});
