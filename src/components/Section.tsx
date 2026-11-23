import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.box}>
      <Text style={styles.title} accessibilityRole="header">{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8, paddingTop: 12, borderTopWidth: 1, borderColor: colors.brass },
  title: { color: colors.brassLight, fontSize: 18 },
});
