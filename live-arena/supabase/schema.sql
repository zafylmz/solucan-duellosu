-- LIVE ARENA şema taslağı. Bu aşamada veritabanı zorunlu değildir.
-- Yerel MVP bellek ve localStorage kullanır. Tablolar sonraki aşamada
-- Supabase üzerinde açılır. Kart verisi tutulmaz.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  role text not null default 'streamer' check (role in ('streamer', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.games (
  id text primary key,
  title text not null,
  status text not null default 'planned' check (status in ('live', 'planned', 'disabled'))
);

create table if not exists public.broadcast_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null references public.games (id),
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.gift_mappings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null references public.games (id),
  gift_name text not null,
  effect text not null check (effect in ('speed', 'turbo', 'shield')),
  amount integer not null check (amount > 0),
  unique (user_id, game_id, gift_name)
);

create table if not exists public.audio_settings (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  enabled boolean not null default true,
  volume numeric not null default 0.8 check (volume >= 0 and volume <= 1)
);

create table if not exists public.race_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  link_id uuid references public.broadcast_links (id) on delete set null,
  winner_username text,
  ranking jsonb not null default '[]'::jsonb,
  finished_at timestamptz not null default now()
);

create table if not exists public.blocked_viewers (
  user_id uuid not null references public.profiles (id) on delete cascade,
  username text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, username)
);

-- Lisans ve ödeme sonraki aşama. Kart numarası yok; yalnızca sağlayıcı referansı.
create table if not exists public.licenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  plan text not null check (plan in ('trial', 'single_game', 'all_games')),
  game_id text references public.games (id),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null check (provider in ('shopier', 'iyzico')),
  provider_ref text not null,
  status text not null check (status in ('pending', 'paid', 'failed')),
  created_at timestamptz not null default now(),
  unique (provider, provider_ref)
);

create table if not exists public.event_logs (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles (id) on delete set null,
  level text not null check (level in ('info', 'error')),
  message text not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.broadcast_links enable row level security;
alter table public.gift_mappings enable row level security;
alter table public.audio_settings enable row level security;
alter table public.race_results enable row level security;
alter table public.blocked_viewers enable row level security;
alter table public.licenses enable row level security;
alter table public.payments enable row level security;
alter table public.event_logs enable row level security;
alter table public.games enable row level security;

-- Yayıncı yalnızca kendi satırlarını görür. Yönetici kontrolü sunucuda, service role ile.
create policy "own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "own links" on public.broadcast_links
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own gifts" on public.gift_mappings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own audio" on public.audio_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own results" on public.race_results
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own blocks" on public.blocked_viewers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own license" on public.licenses
  for select using (auth.uid() = user_id);

create policy "own payments" on public.payments
  for select using (auth.uid() = user_id);

create policy "read live games" on public.games
  for select using (true);
