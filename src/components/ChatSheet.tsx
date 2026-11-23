import { useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { useChat } from '../chat/useChat';
import { colors, fonts } from '../theme';
import { Button } from './Button';
import { Caption, Fact, Words } from './Section';

const SUGGESTIONS = ['What can you see from up there?', 'Why do you always show us the same face?', 'What should I think about tonight?'];

type Props = { chat: ReturnType<typeof useChat>; muted: boolean; onMute: () => void; onClose: () => void };

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable style={styles.link} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.linkText}>{label}</Text>
    </Pressable>
  );
}

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
      <ScrollView style={styles.sheet}>
        <Caption text="Before you ask" />
        <Words>
          The Moon's answers are made by an AI service (Groq). It receives your question, your name, what the Moon remembers, your last messages and your zodiac signs. Never your birth date or place.
        </Words>
        <Words>It can be wrong. Do not share secrets.</Words>
        <Button label="I understand" onPress={agree} mark="→" />
        <Button label="Not now" onPress={onClose} plain />
      </ScrollView>
    );
  }

  return (
    <View style={styles.sheet}>
      <Caption
        text={thinking ? 'The Moon is thinking…' : 'Ask the Moon'}
        right={
          <View style={styles.links}>
            <Link label={muted ? 'Sound on' : 'Sound off'} onPress={onMute} />
            <Text style={styles.slash}>/</Text>
            <Link label="Close" onPress={onClose} />
          </View>
        }
      />

      <FlatList
        style={styles.list}
        inverted={messages.length > 0}
        data={messages}
        keyExtractor={(m) => m.id}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (item.role === 'user' ? <Fact dim>{item.text}</Fact> : <Words>{item.text}</Words>)}
        ListEmptyComponent={
          history === 'loading' ? (
            <ActivityIndicator style={styles.wait} color={colors.ink} />
          ) : history === 'error' ? (
            <>
              <Words>Your earlier talks could not be loaded.</Words>
              <Button label="Try again" onPress={load} />
            </>
          ) : (
            <View style={styles.suggestions}>
              {SUGGESTIONS.map((s) => (
                <Button key={s} label={s} onPress={() => send(s)} disabled={waiting} plain />
              ))}
            </View>
          )
        }
      />

      {problem && (
        <View>
          <Words alarm>{problem.message}</Words>
          <Button label="Ask again" onPress={() => send(problem.question)} disabled={waiting} plain />
        </View>
      )}

      <View style={styles.bar}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Your question"
          placeholderTextColor={colors.dim}
          accessibilityLabel="Your question"
          maxLength={500}
          multiline
        />
        <Pressable
          style={[styles.ask, (waiting || !text.trim()) && styles.faint]}
          onPress={submit}
          disabled={waiting || !text.trim()}
          accessibilityRole="button"
          accessibilityLabel="Ask"
        >
          <Text style={styles.askText}>Ask</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1 },
  links: { flexDirection: 'row', alignItems: 'center' },
  link: { minHeight: 44, minWidth: 44, justifyContent: 'center', paddingHorizontal: 4, marginVertical: -6 },
  linkText: { color: colors.ink, fontFamily: fonts.body, fontSize: 19, textDecorationLine: 'underline' },
  slash: { color: colors.dim, fontFamily: fonts.body, fontSize: 19 },
  list: { flex: 1 },
  wait: { padding: 16 },
  suggestions: { paddingVertical: 4 },
  bar: { flexDirection: 'row', alignItems: 'flex-end', margin: 10, borderWidth: 2, borderColor: colors.ink },
  input: { flex: 1, minHeight: 50, maxHeight: 110, paddingHorizontal: 12, paddingVertical: 12, color: colors.ink, fontFamily: fonts.body, fontSize: 22 },
  ask: { minHeight: 50, minWidth: 64, alignItems: 'center', justifyContent: 'center' },
  askText: { color: colors.ink, fontFamily: fonts.body, fontSize: 24, textDecorationLine: 'underline' },
  faint: { opacity: 0.45 },
});
