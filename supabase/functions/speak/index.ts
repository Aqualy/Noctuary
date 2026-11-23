// The Moon answers one question. Secrets: GROQ_API_KEY (Supabase fills in the SUPABASE_ ones).
import { createClient } from 'npm:@supabase/supabase-js@2';
import { buildMessages, buildReading, CRISIS, inCrisis, parseAnswer, readChart, readRequest } from './moon.ts';

const USER_LIMIT = 20; // questions per user per day
const GLOBAL_LIMIT = 120; // all users together: the free token budget of one day
const MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'content-type': 'application/json' } });

function secretKey(): string {
  const named = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (named) {
    const key = JSON.parse(named)['default'];
    if (key) return key;
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
}

async function askModel(model: string, key: string, messages: unknown[]): Promise<{ status: number; text: string }> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    signal: AbortSignal.timeout(20000),
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.8,
      max_completion_tokens: 900,
      reasoning_effort: 'low',
      response_format: { type: 'json_object' },
    }),
  });
  if (!response.ok) {
    await response.body?.cancel();
    return { status: response.status, text: '' };
  }
  const json = await response.json();
  return { status: 200, text: json?.choices?.[0]?.message?.content ?? '' };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  const db = createClient(Deno.env.get('SUPABASE_URL') ?? '', secretKey(), { auth: { persistSession: false } });
  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth } = await db.auth.getUser(token);
  const user = auth?.user;
  if (!user) return reply(401, { error: 'login' });

  const body = await req.json().catch(() => null);
  const chart = body?.kind === 'reading' ? readChart(body) : null;
  const input = chart ? null : readRequest(body);
  if (!input && !chart) return reply(400, { error: 'question' });

  const keep = async (question: string, moonText: string, mood: string) => {
    const first = await db.from('messages').insert({ user_id: user.id, role: 'user', text: question });
    const second = await db.from('messages').insert({ user_id: user.id, role: 'moon', text: moonText, mood });
    if (first.error || second.error) console.error('messages', first.error?.code, second.error?.code);
  };

  // Answered without the AI and without costing a question; not kept.
  if (input && inCrisis(input.text)) return reply(200, { speech: CRISIS, mood: 'sorrow', remembered: 0, crisis: true });

  const groq = Deno.env.get('GROQ_API_KEY');
  if (!groq) return reply(503, { error: 'tired', reason: 'setup' });

  const { data: turn, error: turnError } = await db.rpc('take_turn', { p_user: user.id, p_user_limit: USER_LIMIT, p_global_limit: GLOBAL_LIMIT });
  if (turnError) return reply(500, { error: 'server' });
  if (turn !== 'ok') return reply(429, { error: 'tired', reason: turn });

  try {
    const [profile, memories, history, days] = await Promise.all([
      db.from('profiles').select('name').eq('user_id', user.id).maybeSingle(),
      db.from('memories').select('kind, text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(8),
      db.from('messages').select('role, text').eq('user_id', user.id).order('created_at', { ascending: false }).limit(6),
      db.from('usage').select('day', { count: 'exact', head: true }).eq('user_id', user.id).gt('count', 0),
    ]);
    const messages = chart
      ? buildReading(chart)
      : buildMessages(input!, profile.data?.name ?? null, memories.data ?? [], (history.data ?? []).reverse(), days.count ?? 0);

    let answer = null;
    let status = 0;
    for (const model of MODELS) {
      try {
        const result = await askModel(model, groq, messages);
        status = result.status;
        answer = result.status === 200 ? parseAnswer(result.text, chart ? 1600 : 900) : null;
      } catch {
        status = 504;
      }
      if (answer) break;
      console.warn('model', model, status);
    }
    if (!answer) {
      await db.rpc('give_back_turn', { p_user: user.id });
      return reply(status === 429 ? 429 : 502, { error: 'tired', reason: status === 429 ? 'busy' : 'model' });
    }

    if (chart) {
      const { error } = await db.from('readings').upsert({ user_id: user.id, text: answer.speech, chart_hash: chart.hash, created_at: new Date().toISOString() });
      if (error) console.error('readings', error.code);
      return reply(200, { speech: answer.speech, mood: answer.mood });
    }
    await keep(input!.text, answer.speech, answer.mood);
    let remembered = 0;
    if (answer.remember.length) {
      const { count } = await db.from('memories').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      for (const m of answer.remember.slice(0, Math.max(0, 40 - (count ?? 40)))) {
        const { error } = await db.from('memories').insert({ user_id: user.id, ...m });
        if (!error) remembered++; // 23505: already remembered
      }
    }
    return reply(200, { speech: answer.speech, mood: answer.mood, remembered });
  } catch (e) {
    console.error('speak', e instanceof Error ? e.message : 'unknown');
    await db.rpc('give_back_turn', { p_user: user.id });
    return reply(500, { error: 'server' });
  }
});
