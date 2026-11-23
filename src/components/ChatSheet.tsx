import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import type { useChat } from '../chat/useChat';
import { colors, fonts } from '../theme';
import { Button } from './Button';

const SUGGESTIONS = ['What can you see from up there?', 'Why do you always show us the same face?', 'What should I think about tonight?'];

type Props = { chat: ReturnType<typeof useChat>; muted: boolean; onMute: () => void; onClose: () => void };

export function ChatSheet({ chat, muted, onMute, onClose }: Props) {
  const { messages, history, consent, agree, thinking, speaking, problem, send, load } = chat;
  const [text, setText] = useState('');
  const waiting = thinking || speaking;

  const submit = () => {
    if (!text.trim() || waiting) return;
    send(text);
    setText('');
  };

  if (consent === false) {
    return (
      <View style={styles.sheet}>
        <View style={styles.padded}>
          <Text style={styles.heading} accessibilityRole="header">Before you ask</Text>
          <Text style={styles.text}>
            The Moon's answers are made by an AI service (Groq). It receives your question, your name, what the Moon remembers, your last messages and your zodiac signs. Never your birth date or place.
          </Text>
          <Text style={styles.text}>It can be wrong. Do not share secrets.</Text>
          <Button label="I understand" onPress={agree} />
          <Button label="Not now" onPress={onClose} plain />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.sheet}>
      <View style={styles.top}>
        <Text style={styles.heading} accessibilityRole="header">Ask the Moon</Text>
        <View style={styles.right}>
          <Button label={muted ? 'Sound on' : 'Sound off'} onPress={onMute} plain />
          <Button label="Close" onPress={onClose} plain />
        </View>
      </View>

      <FlatList
        style={styles.list}
        contentContainerStyle={styles.messages}
        inverted={messages.length > 0}
        data={messages}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <View style={item.role === 'user' ? styles.mine : styles.moons}>
            <Text style={styles.text}>{item.text}</Text>
          </View>
        )}
        ListEmptyComponent={
          history === 'loading' ? (
            <ActivityIndicator color={colors.bone} />
          ) : history === 'error' ? (
            <View style={styles.gap}>
              <Text style={styles.text}>Your earlier talks could not be loaded.</Text>
              <Button label="Try again" onPress={load} />
            </View>
          ) : (
            <View style={styles.gap}>
              {SUGGESTIONS.map((s) => (
                <Button key={s} label={s} onPress={() => send(s)} disabled={waiting} />
              ))}
            </View>
          )
        }
      />

      {thinking && <Text style={styles.status} accessibilityLiveRegion="polite">The Moon is thinking…</Text>}
      {problem && (
        <View style={styles.problem}>
          <Text style={styles.error} accessibilityRole="alert">{problem.message}</Text>
          <Button label="Ask again" onPress={() => send(problem.question)} disabled={waiting} plain />
        </View>
      )}

      <View style={styles.bar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Your question"
          placeholderTextColor={colors.parchment}
          accessibilityLabel="Your question"
          maxLength={500}
          multiline
        />
        <Pressable
          style={({ pressed }) => [styles.send, (pressed || waiting || !text.trim()) && styles.dim]}
          onPress={submit}
          disabled={waiting || !text.trim()}
          accessibilityRole="button"
          accessibilityLabel="Ask"
        >
          <Text style={styles.sendText}>Ask</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, borderTopWidth: 1, borderColor: colors.brass, backgroundColor: colors.ink },
  padded: { padding: 16, gap: 12 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 16 },
  right: { flexDirection: 'row' },
  heading: { color: colors.bone, fontFamily: fonts.title, fontSize: 25 },
  list: { flex: 1 },
  messages: { paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  gap: { gap: 8 },
  mine: { alignSelf: 'flex-end', maxWidth: '85%', padding: 12, backgroundColor: colors.moss },
  moons: { alignSelf: 'flex-start', maxWidth: '85%', padding: 12, borderWidth: 1, borderColor: colors.brass },
  text: { color: colors.bone, fontFamily: fonts.body, fontSize: 16, lineHeight: 23 },
  status: { color: colors.parchment, fontFamily: fonts.body, fontSize: 16, paddingHorizontal: 16, paddingBottom: 8 },
  problem: { paddingHorizontal: 16 },
  error: { color: colors.warning, fontFamily: fonts.body, fontSize: 16 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, padding: 16, paddingTop: 8 },
  input: {
    flex: 1, minHeight: 48, maxHeight: 110, paddingHorizontal: 12, paddingVertical: 12, color: colors.bone, fontFamily: fonts.body, fontSize: 16,
    borderWidth: 1, borderColor: colors.brass, backgroundColor: colors.moss,
  },
  send: { minHeight: 48, minWidth: 64, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.brass, backgroundColor: colors.moss },
  sendText: { color: colors.bone, fontFamily: fonts.body, fontSize: 18 },
  dim: { opacity: 0.5 },
});
