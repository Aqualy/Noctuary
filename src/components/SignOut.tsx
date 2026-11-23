import { useState } from 'react';
import { Alert } from 'react-native';
import { signOut } from '../auth/email';
import { Button } from './Button';

export function SignOut() {
  const [busy, setBusy] = useState(false);

  const onPress = async () => {
    setBusy(true);
    const problem = await signOut().catch(() => 'Something went wrong. Try again.');
    setBusy(false);
    if (problem) Alert.alert('Not signed out', problem);
  };

  return <Button label="Sign out" onPress={onPress} busy={busy} mark="→" />;
}
