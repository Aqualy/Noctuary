import { useRef, useState, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { logIn, signUp, type Outcome } from '../auth/email';
import { Button } from '../components/Button';
import { GateMoon } from '../components/GateMoon';
import { colors } from '../theme';

export default function Gate() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<'login' | 'signup' | null>(null);
  const [result, setResult] = useState<Outcome | null>(null);
  const passwordInput = useRef<ComponentRef<typeof TextInput>>(null);

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
    setBusy(kind);
    setResult(null);
    try {
      setResult(await (kind === 'login' ? logIn : signUp)(address, password));
    } catch {
      setResult({ ok: false, message: 'Something went wrong. Try again.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.moon}>
            <GateMoon />
          </View>
          <Text style={styles.title} accessibilityRole="header">Noctuary</Text>
          <Text style={styles.text}>The Moon is waiting.</Text>

          <View style={styles.field}>
            <Text style={styles.text}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
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
          </View>
          <View style={styles.field}>
            <Text style={styles.text}>Password</Text>
            <TextInput
              ref={passwordInput}
              style={styles.input}
              value={password}
              onChangeText={setPassword}
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
          </View>

          {result?.message && (
            <Text style={[styles.message, !result.ok && styles.error]} accessibilityRole="alert" accessibilityLiveRegion="polite">
              {result.message}
            </Text>
          )}
          <Button label="Log in" onPress={() => submit('login')} busy={busy === 'login'} disabled={busy === 'signup'} />
          <Button label="Sign up" onPress={() => submit('signup')} busy={busy === 'signup'} disabled={busy === 'login'} plain />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  fill: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'flex-end', padding: 16, gap: 12 },
  moon: { flexGrow: 1, minHeight: 180 },
  title: { color: colors.bone, fontSize: 32 },
  text: { color: colors.parchment, fontSize: 16 },
  field: { gap: 4 },
  input: {
    minHeight: 48, paddingHorizontal: 12, color: colors.bone, fontSize: 18,
    borderWidth: 1, borderColor: colors.brass, backgroundColor: colors.moss,
  },
  message: { color: colors.bone, fontSize: 16 },
  error: { color: colors.warning },
});
