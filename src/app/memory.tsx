import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';
import { useSession } from '../auth/SessionProvider';
import { Button } from '../components/Button';
import { PlacePicker } from '../components/PlacePicker';
import { Section } from '../components/Section';
import { SignOut } from '../components/SignOut';
import { useSharedMoon } from '../sky/MoonProvider';
import { colors } from '../theme';

type Memory = { id: string; kind: string; text: string };

function confirm(title: string, text: string, action: () => void) {
  if (Platform.OS === 'web') action(); // Alert does nothing on the web, which is only used for testing
  else Alert.alert(title, text, [{ text: 'Cancel', style: 'cancel' }, { text: 'Forget', style: 'destructive', onPress: action }]);
}

export default function MemoryScreen() {
  const { session } = useSession();
  return session ? <Memories userId={session.user.id} /> : null;
}

function Memories({ userId }: { userId: string }) {
  const router = useRouter();
  const { place, setPlace } = useSharedMoon();
  const [memories, setMemories] = useState<Memory[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setFailed(false);
    const { data, error } = await supabase.from('memories').select('id, kind, text').eq('user_id', userId).order('created_at', { ascending: false });
    if (!alive.current) return;
    if (data) setMemories(data);
    setFailed(error !== null);
  }, [userId]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  // Nothing looks forgotten before the database says so.
  const forget = async (action: () => PromiseLike<{ error: unknown }>, done: string) => {
    setBusy(true);
    setMessage(null);
    const { error } = await action();
    if (!alive.current) return;
    setBusy(false);
    setMessage(error ? 'This could not be forgotten. Try again.' : done);
    if (!error) await load();
  };
  const one = (m: Memory) => forget(() => supabase.from('memories').delete().eq('id', m.id), 'Forgotten.');
  const all = () =>
    confirm('Forget everything?', 'The Moon forgets all it knows about you.', () => forget(() => supabase.from('memories').delete().eq('user_id', userId), 'All forgotten.'));
  const talks = () =>
    confirm('Delete all talks?', 'All questions and answers are deleted.', () => forget(() => supabase.from('messages').delete().eq('user_id', userId), 'All talks are deleted.'));

  const head = (
    <View style={styles.head}>
      <View style={styles.top}>
        <Text style={styles.title} accessibilityRole="header">Memory</Text>
        <Button label="Back" onPress={() => router.back()} plain />
      </View>
      {message && <Text style={styles.note} accessibilityLiveRegion="polite">{message}</Text>}
      <Section title="What the Moon remembers">
        {memories === null && !failed && <ActivityIndicator color={colors.bone} />}
        {failed && (
          <>
            <Text style={styles.text}>The memories could not be loaded.</Text>
            <Button label="Try again" onPress={load} />
          </>
        )}
        {memories?.length === 0 && <Text style={styles.text}>The Moon knows nothing of you yet.</Text>}
      </Section>
    </View>
  );

  const foot = (
    <View style={styles.head}>
      {memories !== null && memories.length > 0 && <Button label="Forget everything" onPress={all} disabled={busy} />}
      <Button label="Delete all talks" onPress={talks} disabled={busy} plain />
      <Section title="Where you look from">
        <Text style={styles.text}>{place.name}</Text>
        {choosing ? (
          <>
            <PlacePicker
              value={null}
              onChange={(p) => {
                if (!p) return;
                setPlace({ name: p.label.split(',')[0], lat: Math.round(p.lat * 100) / 100, lon: Math.round(p.lon * 100) / 100 });
                setChoosing(false);
              }}
            />
            <Button label="Cancel" onPress={() => setChoosing(false)} plain />
          </>
        ) : (
          <Button label="Choose another city" onPress={() => setChoosing(true)} />
        )}
      </Section>
      <SignOut />
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      <FlatList
        data={memories ?? []}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.list}
        ListHeaderComponent={head}
        ListFooterComponent={foot}
        renderItem={({ item }) => (
          <View style={styles.memory}>
            <Text style={[styles.text, styles.grow]}>{item.text}</Text>
            <Pressable style={styles.forget} onPress={() => one(item)} disabled={busy} accessibilityRole="button" accessibilityLabel={`Forget: ${item.text}`}>
              <Text style={styles.note}>Forget</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ink },
  list: { padding: 16, gap: 8 },
  head: { gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.bone, fontSize: 32 },
  text: { color: colors.bone, fontSize: 18, lineHeight: 26 },
  note: { color: colors.parchment, fontSize: 16, lineHeight: 23 },
  memory: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: colors.moss },
  grow: { flex: 1 },
  forget: { minHeight: 48, minWidth: 80, alignItems: 'center', justifyContent: 'center' },
});
