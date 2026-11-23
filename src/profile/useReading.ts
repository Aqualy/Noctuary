import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { readTheChart } from '../chat/ask';
import type { Chart } from '../sky/chart';
import { signOf } from '../sky/chart';

type Reading = { text: string; chart_hash: string };

export function useReading(userId: string, chart: Chart | null, hash: string) {
  const [reading, setReading] = useState<Reading | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const alive = useRef(true);

  const load = useCallback(async () => {
    setStatus('loading');
    const { data, error } = await supabase.from('readings').select('text, chart_hash').eq('user_id', userId).maybeSingle();
    if (!alive.current) return;
    setReading(data);
    setStatus(error ? 'error' : 'ready');
  }, [userId]);

  useEffect(() => {
    alive.current = true;
    load();
    return () => {
      alive.current = false;
    };
  }, [load]);

  const make = async () => {
    if (!chart || busy) return;
    setBusy(true);
    setMessage(null);
    const placements = chart.planets.filter((p) => p.certain).map((p) => ({ body: p.name, sign: p.sign, house: p.house }));
    const rising = chart.ascendant === null ? null : signOf(chart.ascendant);
    const answer = await readTheChart(placements, rising, hash).catch(() => null);
    if (!alive.current) return;
    setBusy(false);
    if (answer?.ok) setReading({ text: answer.speech, chart_hash: hash });
    else setMessage(answer?.message ?? 'The reading could not be made. Try again later.');
  };

  return { reading, outdated: reading !== null && reading.chart_hash !== hash, status, busy, message, load, make };
}
