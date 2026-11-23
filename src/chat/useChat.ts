import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../utils/supabase';
import type { Mood } from '../moon/moonAnim';
import type { MoonState, Place } from '../sky/types';
import { ask, type Signs } from './ask';

export type Message = { id: string; role: 'user' | 'moon'; text: string };

const consentKey = (userId: string) => `consent:${userId}`;

type Options = { userId: string; moon: MoonState; place: Place; signs: Signs; onSpeech: (text: string, mood: Mood) => void };

export function useChat({ userId, moon, place, signs, onSpeech }: Options) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<'loading' | 'ready' | 'error'>('loading');
  const [consent, setConsent] = useState<boolean | null>(null);
  const [thinking, setThinking] = useState(false);
  const [problem, setProblem] = useState<{ message: string; question: string } | null>(null);
  const alive = useRef(true);
  const count = useRef(0);

  const load = useCallback(async () => {
    setHistory('loading');
    const { data, error } = await supabase.from('messages').select('id, role, text').eq('user_id', userId).order('created_at', { ascending: false }).limit(30);
    if (!alive.current) return;
    if (data) setMessages(data as Message[]); // newest first
    setHistory(error ? 'error' : 'ready');
  }, [userId]);

  useEffect(() => {
    alive.current = true;
    load();
    AsyncStorage.getItem(consentKey(userId)).then((v) => alive.current && setConsent(v === 'yes')).catch(() => alive.current && setConsent(false));
    return () => {
      alive.current = false;
    };
  }, [load, userId]);

  const agree = () => {
    setConsent(true);
    AsyncStorage.setItem(consentKey(userId), 'yes').catch(() => {});
  };

  const add = (role: Message['role'], text: string) => {
    const id = `local-${count.current++}`;
    setMessages((m) => [{ id, role, text }, ...m]);
    return id;
  };

  const send = async (question: string) => {
    const text = question.trim();
    if (!text || thinking) return;
    setThinking(true);
    setProblem(null);
    const id = add('user', text);
    const answer = await ask(text, moon, place, signs).catch(() => null);
    if (!alive.current) return;
    setThinking(false);
    if (answer?.ok) {
      add('moon', answer.speech);
      onSpeech(answer.speech, answer.mood);
    } else {
      setMessages((m) => m.filter((x) => x.id !== id)); // the question comes back in the problem
      setProblem({ message: answer?.message ?? 'The Moon cannot answer now. Try again later.', question: text });
      if (answer) onSpeech(answer.phrase, 'sorrow');
    }
  };

  return { messages, history, consent, agree, thinking, problem, send, load };
}
