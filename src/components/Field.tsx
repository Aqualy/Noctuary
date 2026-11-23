import type { Ref, ComponentRef } from 'react';
import { StyleSheet, TextInput, type TextInputProps } from 'react-native';
import { colors, fonts } from '../theme';

// One line to write on.
export function Field({ ref, ...props }: TextInputProps & { ref?: Ref<ComponentRef<typeof TextInput>> }) {
  return <TextInput ref={ref} style={styles.input} placeholderTextColor={colors.dim} {...props} />;
}

const styles = StyleSheet.create({
  input: {
    minHeight: 50, marginHorizontal: 14, marginVertical: 6, paddingHorizontal: 12, color: colors.ink,
    fontFamily: fonts.body, fontSize: 22, borderWidth: 2, borderColor: colors.ink,
  },
});
