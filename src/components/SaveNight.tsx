import { StyleSheet, Text, View } from 'react-native';
import { useTonight } from '../nights/useTonight';
import type { MoonState } from '../sky/types';
import { colors } from '../theme';
import { Button } from './Button';

// Moves to the Almanac once that exists.
export function SaveNight({ moon, userId }: { moon: MoonState; userId: string }) {
  const { status, busy, message, load, save, remove } = useTonight(userId);

  return (
    <View style={styles.box}>
      {message && <Text style={styles.message} accessibilityLiveRegion="polite">{message}</Text>}
      {status === 'loading' && <Button label="Looking up tonight…" onPress={() => {}} disabled />}
      {status === 'error' && <Button label="Try again" onPress={load} />}
      {status === 'unsaved' && <Button label="Save this night" onPress={() => save(moon)} busy={busy} />}
      {status === 'saved' && <Button label="★ Night saved. Remove" onPress={remove} busy={busy} plain />}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  message: { color: colors.warning, fontSize: 16 },
});
