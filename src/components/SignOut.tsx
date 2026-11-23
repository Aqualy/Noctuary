import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { signOut } from '../auth/email';
import { Button } from './Button';

// Moves to the Memory screen once that exists.
export function SignOut() {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    setBusy(true);
    const problem = await signOut().catch(() => 'Something went wrong. Try again.');
    setBusy(false);
    if (problem) Alert.alert('Not signed out', problem);
  };

  return (
    <View style={styles.row}>
      <Button label="Sign out" onPress={onPress} busy={busy} plain />
    </View>
  );
}

const styles = StyleSheet.create({ row: { alignItems: 'flex-end' } });
