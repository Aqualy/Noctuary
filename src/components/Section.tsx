import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../theme';

// A small caption above a hairline. `right` is for actions on the same line.
export function Caption({ text, right }: { text: string; right?: ReactNode }) {
  return (
    <View style={styles.caption}>
      <Text style={styles.label} accessibilityRole="header">{text.toUpperCase()}</Text>
      {right}
    </View>
  );
}

export function Section({ title, right, children }: { title: string; right?: ReactNode; children?: ReactNode }) {
  return (
    <View>
      <Caption text={title} right={right} />
      {children}
    </View>
  );
}

// A fact on the page.
export function Fact({ children, dim = false }: { children: ReactNode; dim?: boolean }) {
  return <Text style={[styles.fact, dim && styles.dim]}>*{children}</Text>;
}

export function Words({ children, dim = false, alarm = false }: { children: ReactNode; dim?: boolean; alarm?: boolean }) {
  return (
    <Text style={[styles.fact, dim && styles.dim, alarm && styles.alarm]} accessibilityRole={alarm ? 'alert' : undefined} accessibilityLiveRegion={alarm ? 'polite' : 'none'}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  caption: {
    minHeight: 34, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderTopWidth: 2, borderBottomWidth: 2, borderColor: colors.line, marginTop: -2,
  },
  label: { color: colors.dim, fontFamily: fonts.body, fontSize: 17, letterSpacing: 0.5, flexShrink: 1 },
  fact: { color: colors.ink, fontFamily: fonts.body, fontSize: 22, lineHeight: 26, paddingHorizontal: 14, paddingVertical: 6 },
  dim: { color: colors.dim, fontSize: 19, lineHeight: 23 },
  alarm: { color: colors.warning },
});
