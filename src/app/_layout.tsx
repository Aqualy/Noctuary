import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SessionProvider, useSession } from '../auth/SessionProvider';
import { ProfileProvider, useProfile } from '../profile/ProfileProvider';
import { colors } from '../theme';

SplashScreen.preventAutoHideAsync();

// No session: only the gate exists. A session: the ritual on the first visit, otherwise the app.
function Screens() {
  const { session, loading: sessionLoading } = useSession();
  const { status } = useProfile();
  const loading = sessionLoading || (session !== null && status === 'loading');

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return <View style={styles.screen} />;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: styles.screen, animation: 'fade' }}>
      <Stack.Protected guard={session !== null && status === 'new'}>
        <Stack.Screen name="ritual" />
      </Stack.Protected>
      <Stack.Protected guard={session !== null && status !== 'new'}>
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
        <ProfileProvider>
          <Screens />
        </ProfileProvider>
      </SessionProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({ screen: { flex: 1, backgroundColor: colors.ink } });
