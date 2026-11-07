-- Solucan Düellosu — özel oda lobisi
-- Supabase SQL Editor'da bir kez çalıştırın. Realtime için rooms tablosunu
-- Database → Replication altında da etkinleştirin (veya aşağıdaki alter'ı kullanın).

create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 40),
  password_hash text,
  status text not null default 'waiting'
    check (status in ('waiting', 'playing', 'closed')),
  host_token text not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rooms_waiting_created_idx
  on public.rooms (created_at desc)
  where status = 'waiting';

create or replace view public.rooms_lobby as
select
  id,
  name,
  (password_hash is not null) as has_password,
  status,
  created_at
from public.rooms
where status = 'waiting';

alter table public.rooms enable row level security;

-- Anon istemci yalnızca lobiyi görür; ham password_hash asla.
drop policy if exists "rooms_lobby_select" on public.rooms;
-- Tabloya doğrudan select yok; view + RPC kullanılıyor.
revoke all on public.rooms from anon, authenticated;
grant select on public.rooms_lobby to anon, authenticated;

create or replace function public.create_room(p_name text, p_password text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  cleaned text := trim(p_name);
  hash text := null;
  row_id uuid;
  row_name text;
  row_created timestamptz;
begin
  if cleaned is null or char_length(cleaned) < 1 or char_length(cleaned) > 40 then
    return jsonb_build_object('ok', false, 'error', 'bad_name');
  end if;
  if p_password is not null and length(p_password) > 0 then
    if char_length(p_password) > 64 then
      return jsonb_build_object('ok', false, 'error', 'bad_password');
    end if;
    hash := encode(digest('sd-room-v1:' || p_password, 'sha256'), 'hex');
  end if;
  insert into public.rooms (name, password_hash)
  values (cleaned, hash)
  returning id, name, created_at into row_id, row_name, row_created;
  return jsonb_build_object(
    'ok', true,
    'room', jsonb_build_object(
      'id', row_id,
      'name', row_name,
      'has_password', hash is not null,
      'status', 'waiting',
      'created_at', row_created
    )
  );
end;
$$;

create or replace function public.join_room(p_id uuid, p_password text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.rooms%rowtype;
  expect text;
begin
  select * into r from public.rooms where id = p_id and status = 'waiting';
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  if r.password_hash is not null then
    expect := encode(digest('sd-room-v1:' || coalesce(p_password, ''), 'sha256'), 'hex');
    if expect is distinct from r.password_hash then
      return jsonb_build_object('ok', false, 'error', 'bad_password');
    end if;
  end if;
  return jsonb_build_object(
    'ok', true,
    'room', jsonb_build_object(
      'id', r.id,
      'name', r.name,
      'has_password', r.password_hash is not null,
      'status', r.status,
      'created_at', r.created_at
    )
  );
end;
$$;

create or replace function public.close_room(p_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.rooms
  set status = 'closed', updated_at = now()
  where id = p_id and status = 'waiting';
  if not found then
    return jsonb_build_object('ok', false, 'error', 'not_found');
  end if;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.create_room(text, text) to anon, authenticated;
grant execute on function public.join_room(uuid, text) to anon, authenticated;
grant execute on function public.close_room(uuid) to anon, authenticated;

-- Realtime: lobideki değişiklikleri dinlemek için
alter table public.rooms replica identity full;
do $$
begin
  begin
    alter publication supabase_realtime add table public.rooms;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;
