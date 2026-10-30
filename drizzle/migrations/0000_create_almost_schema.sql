create type public.intention_status as enum ('still_thinking','ready_to_explore','taking_small_step','completed','no_longer_relevant');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  onboarding_completed boolean not null default false,
  onboarding_blocker text,
  onboarding_categories text[] not null default '{}',
  reflection_cadence text not null default 'weekly',
  preferred_theme text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.intentions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  why_it_matters text,
  blocker text,
  category text not null default 'other',
  status public.intention_status not null default 'still_thinking',
  status_changed_at timestamptz not null default now(),
  revisit_count integer not null default 0,
  last_revisited_at timestamptz,
  next_step text,
  next_step_at timestamptz,
  timeframe text,
  people_involved text,
  notes text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  intention_id uuid references public.intentions(id) on delete cascade,
  content text not null,
  prompt text,
  created_at timestamptz not null default now()
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  intention_id uuid not null references public.intentions(id) on delete cascade,
  reminder_date date not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create index intentions_user_created_idx on public.intentions (user_id, created_at desc);
create index intentions_user_status_idx on public.intentions (user_id, status);
create index reflections_user_created_idx on public.reflections (user_id, created_at desc);
create index reflections_intention_idx on public.reflections (intention_id);
create index reminders_user_idx on public.reminders (user_id, reminder_date);

-- Keep updated_at fresh on intentions.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger intentions_touch_updated
before update on public.intentions
for each row execute function public.touch_updated_at();

-- Track status changes for pattern insights.
create or replace function public.intentions_track_status()
returns trigger language plpgsql as $$
begin
  if new.status is distinct from old.status then
    new.status_changed_at = now();
    if new.status = 'no_longer_relevant' and old.status <> 'no_longer_relevant' then
      -- marking as no longer relevant is itself a form of revisiting
      new.revisit_count = old.revisit_count + 1;
      new.last_revisited_at = now();
    end if;
  end if;
  return new;
end;
$$;

create trigger intentions_track_status_change
before update on public.intentions
for each row execute function public.intentions_track_status();

-- Auto-create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', null));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Count a revisit whenever a reflection is attached to an intention.
create or replace function public.reflections_count_revisit()
returns trigger language plpgsql as $$
begin
  if new.intention_id is not null then
    update public.intentions
    set revisit_count = revisit_count + 1, last_revisited_at = now()
    where id = new.intention_id;
  end if;
  return new;
end;
$$;

create trigger reflections_count_revisit_trigger
after insert on public.reflections
for each row execute function public.reflections_count_revisit();

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.intentions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reflections TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reminders TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.intentions TO service_role;
GRANT ALL ON public.reflections TO service_role;
GRANT ALL ON public.reminders TO service_role;
GRANT USAGE ON TYPE public.intention_status TO authenticated, service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can view their own intentions"
  on public.intentions for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert their own intentions"
  on public.intentions for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update their own intentions"
  on public.intentions for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own intentions"
  on public.intentions for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users can view their own reflections"
  on public.reflections for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert their own reflections"
  on public.reflections for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update their own reflections"
  on public.reflections for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own reflections"
  on public.reflections for delete to authenticated
  using (auth.uid() = user_id);

create policy "Users can view their own reminders"
  on public.reminders for select to authenticated
  using (auth.uid() = user_id);
create policy "Users can insert their own reminders"
  on public.reminders for insert to authenticated
  with check (auth.uid() = user_id);
create policy "Users can update their own reminders"
  on public.reminders for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own reminders"
  on public.reminders for delete to authenticated
  using (auth.uid() = user_id);