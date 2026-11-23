// An action is an underlined word: in a darker band, or plain on the paper.
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts } from '../theme';

type Props = { label: string; onPress: () => void; mark?: string; busy?: boolean; disabled?: boolean; plain?: boolean };

export function Button({ label, onPress, mark, busy = false, disabled = false, plain = false }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.band, plain && styles.plain, pressed && (plain ? styles.pressedPlain : styles.pressed), disabled && styles.dim]}
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy || disabled }}
    >
      <Text style={[styles.text, plain && styles.small]}>{label}</Text>
      {busy ? <ActivityIndicator color={colors.ink} /> : mark ? <Text style={styles.mark} accessible={false}>{mark}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  band: {
    minHeight: 54, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
    borderTopWidth: 2, borderBottomWidth: 2, borderColor: colors.line, backgroundColor: colors.band, marginTop: -2,
  },
  plain: { minHeight: 48, borderColor: 'transparent', backgroundColor: 'transparent', marginTop: 0, justifyContent: 'flex-start' },
  pressed: { backgroundColor: colors.line },
  pressedPlain: { backgroundColor: colors.band },
  dim: { opacity: 0.45 },
  text: { color: colors.ink, fontFamily: fonts.body, fontSize: 24, textDecorationLine: 'underline', flexShrink: 1 },
  small: { fontSize: 21 },
  mark: { color: colors.ink, fontFamily: fonts.body, fontSize: 24 },
});
