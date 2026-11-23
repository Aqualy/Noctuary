import { StyleSheet, Text, View } from 'react-native';
import type { MoonState, Place, Source } from '../sky/types';
import { clockTime } from '../sky/when';
import { colors, fonts } from '../theme';
import { Button } from './Button';
import { Caption, Fact } from './Section';

type Props = { moon: MoonState; source: Source; place: Place; loading: boolean; failed: boolean; onRetry: () => void };

function note({ moon, source, place, loading, failed }: Props): string {
  if (failed && loading) return 'Trying again…';
  if (failed && source === 'saved') return `No connection. Last seen at ${clockTime(moon.at)}, ${place.name}`;
  if (failed) return `No connection. Calculated on this phone, ${place.name}`;
  if (source === 'live') return `Live from ${place.name}, ${clockTime(moon.at)}`;
  return 'The instrument is being aligned…';
}

export function MoonStatus(props: Props) {
  const { moon, loading, failed, onRetry } = props;
  return (
    <View>
      <Caption text={note(props)} />
      <View style={styles.columns}>
        <View style={styles.left}>
          <Text style={styles.phase} accessibilityRole="header">{moon.phaseName}</Text>
        </View>
        <View style={styles.right}>
          <Fact>{Math.round(moon.illumination)}% lit, {Math.floor(moon.ageDays)} days old</Fact>
          <Fact>{moon.altitude >= 0 ? `Look ${moon.compass}, ${Math.round(moon.altitude)}° up` : 'Under the horizon'}</Fact>
          <Fact>{Math.round(moon.distanceKm / 1000)} thousand km away</Fact>
        </View>
      </View>
      {failed && <Button label="Retry" onPress={onRetry} busy={loading} />}
    </View>
  );
}

const styles = StyleSheet.create({
  columns: { flexDirection: 'row' },
  left: { flex: 1, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 8 },
  right: { flex: 1.35, borderLeftWidth: 2, borderColor: colors.line, paddingVertical: 4 },
  phase: { color: colors.ink, fontFamily: fonts.title, fontSize: 38, lineHeight: 38 },
});
