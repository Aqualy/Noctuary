// Every screen is a sheet of paper in a moss-green frame.
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export function Page({ children }: { children: ReactNode }) {
  const { top, bottom } = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={styles.moss} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.frame, { paddingTop: top + 8, paddingBottom: Math.max(bottom - 8, 10) }]}>
        <View style={styles.sheet}>{children}</View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  moss: { flex: 1, backgroundColor: colors.moss },
  frame: { flex: 1, paddingHorizontal: 8 },
  sheet: { flex: 1, overflow: 'hidden', borderWidth: 2, borderColor: colors.frame, borderRadius: 6, backgroundColor: colors.paper },
});
