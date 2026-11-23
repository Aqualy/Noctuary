import { useRef, useState, type ComponentRef } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { logIn, signUp, type Outcome } from '../auth/email';
import { continueWithGoogle } from '../auth/google';
import { Button } from '../components/Button';
import { Field } from '../components/Field';
import { GateMoon } from '../components/GateMoon';
import { Page } from '../components/Page';
import { Caption, Words } from '../components/Section';
import { colors, fonts } from '../theme';

type Kind = 'login' | 'signup' | 'google';

export default function Gate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<Kind | null>(null);
  const [result, setResult] = useState<Outcome | null>(null);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);

  const run = async (kind: Kind, action: () => Promise<Outcome>) => {
    setBusy(kind);
    setResult(null);
    try {
      setResult(await action());
    } catch {
      setResult({ ok: false, message: 'Something went wrong. Try again.' });
    } finally {
      setBusy(null);
    }
  };

  const submit = async (kind: 'login' | 'signup') => {
    if (busy) return;
    const address = email.trim();
    if (!address || !password) {
      setResult({ ok: false, message: 'Fill in your email and password.' });
      return;
    }
    if (kind === 'signup' && password.length < 6) {
      setResult({ ok: false, message: 'Choose a password of at least 6 characters.' });
      return;
    }
    await run(kind, () => (kind === 'login' ? logIn : signUp)(address, password));
  };

  return (
    <Page>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.moon}>
          <GateMoon />
        </View>
        <Caption text="The Moon is waiting" />
        <Text style={styles.title} accessibilityRole="header">Noctuary</Text>
        <Field
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          accessibilityLabel="Email"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          keyboardType="email-address"
          textContentType="username"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordInput.current?.focus()}
          editable={!busy}
        />
        <Field
          ref={passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          accessibilityLabel="Password"
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={() => submit('login')}
          editable={!busy}
        />
        {result?.message && <Words alarm={!result.ok}>{result.message}</Words>}
        <View style={styles.actions}>
          <Button label="Log in" onPress={() => submit('login')} busy={busy === 'login'} disabled={busy !== null} mark="→" />
          <Button label="Sign up" onPress={() => submit('signup')} busy={busy === 'signup'} disabled={busy !== null} mark="+" />
          <Button label="Continue with Google" onPress={() => run('google', continueWithGoogle)} busy={busy === 'google'} disabled={busy !== null} mark="→" />
        </View>
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1 },
  moon: { flexGrow: 1, minHeight: 180 },
  title: { color: colors.ink, fontFamily: fonts.title, fontSize: 52, lineHeight: 56, paddingHorizontal: 14, paddingTop: 6 },
  actions: { paddingTop: 8 },
});
