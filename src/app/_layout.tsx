import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.fill}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: styles.screen }} />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { backgroundColor: '#0E120D' },
});
