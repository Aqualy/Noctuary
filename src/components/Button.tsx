import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme';

type Props = { label: string; onPress: () => void; busy?: boolean; disabled?: boolean; plain?: boolean };

export function Button({ label, onPress, busy = false, disabled = false, plain = false }: Props) {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, plain && styles.plain, (pressed || disabled) && styles.dim]}
      onPress={onPress}
      disabled={busy || disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled: busy || disabled }}
    >
      {busy ? <ActivityIndicator color={colors.bone} /> : <Text style={styles.text}>{label}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: colors.brass, backgroundColor: colors.moss,
  },
  plain: { borderColor: 'transparent', backgroundColor: 'transparent' },
  dim: { opacity: 0.6 },
  text: { color: colors.bone, fontSize: 18 },
});
