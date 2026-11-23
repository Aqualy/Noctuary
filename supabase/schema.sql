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

-- Step 7: what the Moon asks on the first visit. Every answer may be missing.

create table if not exists public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  name text check (char_length(name) between 1 and 40),
  birth_date date check (birth_date >= '1900-01-01'),
  birth_time time,
  birth_place text check (char_length(birth_place) <= 200),
  lat double precision check (lat between -90 and 90),
  lon double precision check (lon between -180 and 180),
  tz text check (char_length(tz) <= 64),
  onboarded_at timestamptz
);

alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "change own profile" on public.profiles;
create policy "change own profile" on public.profiles
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Step 8: the conversation. Only the speak function (service_role) writes; people read and delete their own.

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'moon')),
  text text not null check (char_length(text) between 1 and 1200),
  mood text check (mood in ('calm', 'joy', 'sorrow', 'stern', 'wonder')),
  created_at timestamptz not null default clock_timestamp()
);
create index if not exists messages_user_time on public.messages (user_id, created_at desc);

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('person', 'place', 'feeling', 'event', 'wish', 'other')),
  text text not null check (char_length(text) between 1 and 160),
  created_at timestamptz not null default now()
);
create unique index if not exists memories_once on public.memories (user_id, lower(text));

create table if not exists public.usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
create index if not exists usage_day on public.usage (day);

alter table public.messages enable row level security;
alter table public.memories enable row level security;
alter table public.usage enable row level security;

revoke all on public.messages, public.memories, public.usage from anon, authenticated;
grant select, delete on public.messages, public.memories to authenticated;
grant select, insert, update, delete on public.messages, public.memories, public.usage to service_role;
grant select on public.profiles to service_role;

drop policy if exists "read own messages" on public.messages;
create policy "read own messages" on public.messages for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "delete own messages" on public.messages;
create policy "delete own messages" on public.messages for delete to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "read own memories" on public.memories;
create policy "read own memories" on public.memories for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "delete own memories" on public.memories;
create policy "delete own memories" on public.memories for delete to authenticated using ((select auth.uid()) = user_id);

-- Counts a question, in one step so two phones cannot both take the last one.
create or replace function public.take_turn(p_user uuid, p_user_limit int, p_global_limit int)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  today date := (now() at time zone 'utc')::date;
  mine int;
  everyone int;
begin
  perform pg_advisory_xact_lock(hashtext('noctuary_turns'));
  select coalesce(sum(u.count), 0) into everyone from public.usage u where u.day = today;
  if everyone >= p_global_limit then return 'everyone'; end if;
  select coalesce(max(u.count), 0) into mine from public.usage u where u.user_id = p_user and u.day = today;
  if mine >= p_user_limit then return 'user'; end if;
  insert into public.usage (user_id, day, count) values (p_user, today, 1)
    on conflict (user_id, day) do update set count = public.usage.count + 1;
  return 'ok';
end $$;

create or replace function public.give_back_turn(p_user uuid)
returns void language sql security invoker set search_path = '' as $$
  update public.usage set count = greatest(count - 1, 0)
  where user_id = p_user and day = (now() at time zone 'utc')::date;
$$;

revoke execute on function public.take_turn(uuid, int, int) from public, anon, authenticated;
revoke execute on function public.give_back_turn(uuid) from public, anon, authenticated;
grant execute on function public.take_turn(uuid, int, int) to service_role;
grant execute on function public.give_back_turn(uuid) to service_role;

-- Step 12: the reading of a birth chart. Written by the speak function only.

create table if not exists public.readings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 2000),
  chart_hash text not null check (char_length(chart_hash) between 1 and 200),
  created_at timestamptz not null default now()
);
alter table public.readings enable row level security;
revoke all on public.readings from anon, authenticated;
grant select, delete on public.readings to authenticated;
grant select, insert, update, delete on public.readings to service_role;
drop policy if exists "read own reading" on public.readings;
create policy "read own reading" on public.readings for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "delete own reading" on public.readings;
create policy "delete own reading" on public.readings for delete to authenticated using ((select auth.uid()) = user_id);
