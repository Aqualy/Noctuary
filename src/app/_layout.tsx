import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider, useSession } from '../auth/SessionProvider';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync();

// No session: only the gate exists. A session: only the app exists.
function Screens() {
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: styles.screen, animation: 'fade' }}>
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="index" />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="gate" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.screen}>
      <StatusBar style="light" />
      <SessionProvider>
        <Screens />
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.ink } });
