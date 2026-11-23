import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '../../utils/supabase';
import { explain, type Outcome } from './email';

WebBrowser.maybeCompleteAuthSession(); // closes the pop-up on the web

const FAILED: Outcome = { ok: false, message: 'Google login did not work. Try again, or use your email.' };
const CANCELLED: Outcome = { ok: true, message: null };

// Supabase puts the tokens after #, errors after ? or #.
function readParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const part of url.split(/[?#]/).slice(1)) {
    for (const pair of part.split('&')) {
      const [key, ...value] = pair.split('=');
      params[key] = decodeURIComponent(value.join('=').replace(/\+/g, ' '));
    }
  }
  return params;
}

export async function continueWithGoogle(): Promise<Outcome> {
  const redirectTo = makeRedirectUri({ scheme: 'noctuary', path: 'auth' });
  if (__DEV__) console.log('Google comes back to', redirectTo);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) return { ok: false, message: explain(error) };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success') return CANCELLED;

  const params = readParams(result.url);
  if (params.error === 'access_denied' && !params.error_code) return CANCELLED;
  if (params.error || !params.access_token || !params.refresh_token) return FAILED;

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });
  return sessionError ? { ok: false, message: explain(sessionError) } : { ok: true, message: null };
}
