-- Noctuary. Run in the Supabase SQL Editor; safe to run again.
-- Step A5: saved nights. Other tables follow with the steps that need them.

create table if not exists public.nights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_date date not null,
  phase text not null check (char_length(phase) between 1 and 40),
  illumination real not null check (illumination between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, local_date)
);

alter table public.nights enable row level security;

-- Logged-in users only; nobody edits a saved night, so there is no update.
revoke all on public.nights from anon, authenticated;
grant select, insert, delete on public.nights to authenticated;

drop policy if exists "read own nights" on public.nights;
create policy "read own nights" on public.nights
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "save own nights" on public.nights;
create policy "save own nights" on public.nights
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "delete own nights" on public.nights;
create policy "delete own nights" on public.nights
  for delete to authenticated using ((select auth.uid()) = user_id);
