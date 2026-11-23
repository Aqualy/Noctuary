import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { MoonState, Place, Source } from '../sky/types';
import { colors, fonts } from '../theme';

type Props = {
  moon: MoonState;
  source: Source;
  place: Place;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
};

const time = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function note({ moon, source, place, loading, failed }: Props): string {
  if (failed && loading) return 'Trying again…';
  if (failed && source === 'saved') return `No connection. Last seen at ${time(moon.at)}, ${place.name}.`;
  if (failed) return `No connection. Calculated on this phone, ${place.name}.`;
  if (source === 'live') return `Live from ${place.name}, ${time(moon.at)}`;
  return 'The instrument is being aligned…';
}

export function MoonStatus(props: Props) {
  const { moon, loading, failed, onRetry } = props;
  const altitude = Math.round(moon.altitude);
  const where = moon.altitude >= 0 ? `${moon.compass}, ${altitude}° up` : 'under the horizon';
  return (
    <View style={styles.panel}>
      <Text style={styles.phase} accessibilityRole="header">{moon.phaseName}</Text>
      <Text style={styles.line}>
        {Math.round(moon.illumination)}% lit, {where}
      </Text>
      <Text style={styles.line}>
        {Math.floor(moon.ageDays)} days old, {Math.round(moon.distanceKm / 1000)} thousand km away
      </Text>
      <Text style={styles.note} accessibilityLiveRegion="polite">{note(props)}</Text>
      {failed && (
        <Pressable
          style={({ pressed }) => [styles.retry, pressed && styles.pressed]}
          onPress={onRetry}
          disabled={loading}
          accessibilityRole="button"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 16, gap: 4, borderTopWidth: 1, borderColor: colors.brass, backgroundColor: colors.ink },
  phase: { color: colors.bone, fontFamily: fonts.title, fontSize: 35 },
  line: { color: colors.bone, fontFamily: fonts.body, fontSize: 18 },
  note: { color: colors.parchment, fontFamily: fonts.body, fontSize: 16, marginTop: 8 },
  retry: {
    minHeight: 48, marginTop: 8, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.brass, backgroundColor: colors.moss,
  },
  pressed: { opacity: 0.7 },
  retryText: { color: colors.bone, fontFamily: fonts.body, fontSize: 18 },
});
