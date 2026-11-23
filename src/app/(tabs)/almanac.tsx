import { Image } from 'expo-image';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSession } from '../../auth/SessionProvider';
import { Button } from '../../components/Button';
import { Fact, Section, Words } from '../../components/Section';
import { useNights, type Night } from '../../nights/useNights';
import { folkloreFor } from '../../sky/folklore';
import { useSharedMoon } from '../../sky/MoonProvider';
import { useEclipses } from '../../sky/useEclipses';
import { clockTime, day, dayTime } from '../../sky/when';
import { colors, fonts } from '../../theme';

export default function AlmanacScreen() {
  const { session } = useSession();
  return session ? <Almanac userId={session.user.id} /> : null;
}

function Almanac({ userId }: { userId: string }) {
  const { moon, source, failed, loading, place, refresh } = useSharedMoon();
  const { eclipses, failed: noEclipses, load: loadEclipses } = useEclipses();
  const { nights, tonight, failed: noNights, busy, message, load, save, remove } = useNights(userId);

  const head = (
    <View>
      <Section title={`Today, ${place.name}`}>
        <View style={styles.columns}>
          <View style={styles.half}>
            <Fact>{moon.rise ? `Rises ${clockTime(moon.rise)}` : 'Does not rise today'}</Fact>
          </View>
          <View style={[styles.half, styles.right]}>
            <Fact>{moon.set ? `Sets ${clockTime(moon.set)}` : 'Does not set today'}</Fact>
          </View>
        </View>
        {source !== 'live' && (
          <Words dim>{source === 'saved' ? `Last seen at ${clockTime(moon.at)}.` : 'Calculated on this phone.'}</Words>
        )}
        {failed && <Button label="Retry" onPress={refresh} busy={loading} />}
      </Section>
      <Image style={styles.picture} source={require('../../../assets/images/eye.png')} contentFit="cover" accessible={false} />

      <Section title="Coming phases">
        <View style={styles.padded}>
          {moon.next.map((p) => (
            <View key={p.at} style={styles.row}>
              <Text style={styles.text}>*{p.name}</Text>
              <Text style={styles.text}>{dayTime(p.at)}</Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title={`Told of the ${moon.phaseName}`}>
        <Fact>{folkloreFor(moon.phaseName)}</Fact>
      </Section>

      <Section title="Eclipses somewhere on Earth">
        {noEclipses ? (
          <>
            <Words>The eclipses could not be loaded.</Words>
            <Button label="Try again" onPress={loadEclipses} />
          </>
        ) : eclipses === null ? (
          <Words dim>Looking ahead…</Words>
        ) : eclipses.length === 0 ? (
          <Words>None known soon.</Words>
        ) : (
          eclipses.slice(0, 2).map((e) => (
            <View key={e.at}>
              <Fact>{e.label}</Fact>
              <Words dim>{dayTime(e.at)}</Words>
            </View>
          ))
        )}
        <Words dim>Not every eclipse can be seen from {place.name}.</Words>
      </Section>

      <Section title="Your nights">
        {message && <Words alarm>{message}</Words>}
        {nights !== null && !tonight && <Button label="Save this night" onPress={() => save(moon)} busy={busy} mark="+" />}
        {noNights && (
          <>
            <Words>Your saved nights could not be loaded.</Words>
            <Button label="Try again" onPress={load} />
          </>
        )}
        {nights === null && !noNights && <ActivityIndicator style={styles.wait} color={colors.ink} />}
        {nights?.length === 0 && <Words>No saved nights yet.</Words>}
      </Section>
    </View>
  );

  const row = ({ item }: { item: Night }) => {
    const name = item.id === tonight?.id ? 'Tonight' : day(item.local_date);
    return (
      <View style={styles.night}>
        <View style={styles.half}>
          <Fact>{name}</Fact>
          <Text style={styles.detail}>{item.phase}, {Math.round(item.illumination)}% lit</Text>
        </View>
        <Pressable style={styles.remove} onPress={() => remove(item.id)} disabled={busy} accessibilityRole="button" accessibilityLabel={`Remove ${name}`}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>
    );
  };

  return <FlatList style={styles.screen} data={nights ?? []} keyExtractor={(n) => n.id} renderItem={row} ListHeaderComponent={head} contentContainerStyle={styles.end} />;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  end: { paddingBottom: 24 },
  columns: { flexDirection: 'row' },
  half: { flex: 1 },
  right: { borderLeftWidth: 2, borderColor: colors.line },
  picture: { width: '100%', aspectRatio: 1050 / 294 },
  padded: { paddingHorizontal: 14, paddingVertical: 6 },
  row: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  text: { color: colors.ink, fontFamily: fonts.body, fontSize: 22, lineHeight: 28 },
  wait: { padding: 16 },
  night: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 2, borderColor: colors.line },
  detail: { color: colors.dim, fontFamily: fonts.body, fontSize: 19, paddingHorizontal: 14, paddingBottom: 6, marginTop: -6 },
  remove: { minHeight: 48, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
  removeText: { color: colors.ink, fontFamily: fonts.body, fontSize: 20, textDecorationLine: 'underline' },
});
