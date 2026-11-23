import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../utils/supabase';
import { useSession } from '../auth/SessionProvider';
import { Button } from '../components/Button';
import { Page } from '../components/Page';
import { PlacePicker } from '../components/PlacePicker';
import { Caption, Fact, Section, Words } from '../components/Section';
import { SignOut } from '../components/SignOut';
import { useSharedMoon } from '../sky/MoonProvider';
import { colors, fonts } from '../theme';

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
    <View>
      <Caption
        text="Memory"
        right={
          <Pressable style={styles.link} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.linkText}>Back</Text>
          </Pressable>
        }
      />
      <Text style={styles.title} accessibilityRole="header">Remembered</Text>
      {message && <Words alarm>{message}</Words>}
      {memories === null && !failed && <ActivityIndicator style={styles.wait} color={colors.ink} />}
      {failed && (
        <>
          <Words>The memories could not be loaded.</Words>
          <Button label="Try again" onPress={load} />
        </>
      )}
      {memories?.length === 0 && <Words>The Moon knows nothing of you yet.</Words>}
    </View>
  );

  const foot = (
    <View style={styles.foot}>
      {memories !== null && memories.length > 0 && <Button label="Forget everything" onPress={all} disabled={busy} mark="×" />}
      <Button label="Delete all talks" onPress={talks} disabled={busy} mark="×" />
      <Section title="Where you look from">
        <Fact>{place.name}</Fact>
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
          <Button label="Choose another city" onPress={() => setChoosing(true)} mark="→" />
        )}
      </Section>
      <SignOut />
    </View>
  );

  return (
    <Page>
      <FlatList
        data={memories ?? []}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={head}
        ListFooterComponent={foot}
        renderItem={({ item }) => (
          <View style={styles.memory}>
            <View style={styles.grow}>
              <Fact>{item.text}</Fact>
            </View>
            <Pressable style={styles.link} onPress={() => one(item)} disabled={busy} accessibilityRole="button" accessibilityLabel={`Forget: ${item.text}`}>
              <Text style={styles.linkText}>Forget</Text>
            </Pressable>
          </View>
        )}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.ink, fontFamily: fonts.title, fontSize: 38, paddingHorizontal: 14, paddingTop: 8 },
  wait: { padding: 16 },
  memory: { flexDirection: 'row', alignItems: 'center' },
  grow: { flex: 1 },
  link: { minHeight: 48, minWidth: 64, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, marginVertical: -6 },
  linkText: { color: colors.ink, fontFamily: fonts.body, fontSize: 20, textDecorationLine: 'underline' },
  foot: { paddingTop: 16 },
});
