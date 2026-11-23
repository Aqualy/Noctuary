import { isAuthError, isAuthRetryableFetchError } from '@supabase/supabase-js';
import { supabase } from '../../utils/supabase';

export type Outcome = { ok: boolean; message: string | null };

const MESSAGES: Record<string, string> = {
  invalid_credentials: 'The email or password is wrong.',
  email_not_confirmed: 'Confirm your email first: open the link we sent you.',
  user_already_exists: 'This email already has an account. Log in instead.',
  email_exists: 'This email already has an account. Log in instead.',
  weak_password: 'Choose a stronger password, at least 6 characters.',
  email_address_invalid: 'This email address is not accepted.',
  validation_failed: 'This does not look like an email address.',
  signup_disabled: 'New accounts are closed at the moment.',
  over_email_send_rate_limit: 'Too many emails were sent. Try again in an hour.',
  over_request_rate_limit: 'Too many attempts. Wait a few minutes.',
};

export function explain(error: unknown): string {
  if (isAuthRetryableFetchError(error)) return 'No connection. Check your internet and try again.';
  if (isAuthError(error) && error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  return 'Something went wrong. Try again.';
}

export async function logIn(email: string, password: string): Promise<Outcome> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, message: explain(error) } : { ok: true, message: null };
}

export async function signUp(email: string, password: string): Promise<Outcome> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, message: explain(error) };
  if (data.session) return { ok: true, message: null };
  // With email confirmation on, Supabase hides whether the address is taken: a known address has no identities.
  if (data.user?.identities?.length === 0) return { ok: false, message: MESSAGES.user_already_exists };
  return { ok: true, message: 'Almost there: open the link we sent to your email, then log in.' };
}

export async function signOut(): Promise<string | null> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  return error ? explain(error) : null;
}
