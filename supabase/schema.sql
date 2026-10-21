-- Trip sync for premfren.github.io
-- Run once in Supabase: SQL Editor › New query › paste › Run.
--
-- One row per trip holding the whole trip as JSON. The table is closed to the
-- public API; clients can only read or write a trip through the two functions
-- below, and only with that trip's secret (shared via the invite link).
-- Passport details are stripped by the app before upload; QR images are stored
-- as their own rows so the trip row stays small.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.trip_sync (
  id          text primary key,
  secret_hash text   not null,
  data        jsonb  not null,
  updated_at  bigint not null,
  server_time timestamptz not null default now()
);

alter table public.trip_sync enable row level security;
revoke all on public.trip_sync from anon, authenticated;

create or replace function public.trip_get(p_id text, p_secret text)
returns jsonb
language sql
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object('data', data, 'updated_at', updated_at)
  from trip_sync
  where id = p_id
    and secret_hash = encode(digest(p_secret, 'sha256'), 'hex');
$$;

create or replace function public.trip_put(p_id text, p_secret text, p_data jsonb, p_updated_at bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  h text := encode(digest(p_secret, 'sha256'), 'hex');
  r trip_sync;
begin
  if length(p_secret) < 16 then
    raise exception 'secret too short';
  end if;

  select * into r from trip_sync where id = p_id for update;

  if not found then
    insert into trip_sync (id, secret_hash, data, updated_at)
    values (p_id, h, p_data, p_updated_at);
    return jsonb_build_object('ok', true, 'updated_at', p_updated_at);
  end if;

  if r.secret_hash <> h then
    raise exception 'forbidden';
  end if;

  -- the other device saved something newer: hand it back instead of overwriting
  if r.updated_at > p_updated_at then
    return jsonb_build_object('ok', false, 'data', r.data, 'updated_at', r.updated_at);
  end if;

  update trip_sync
     set data = p_data, updated_at = p_updated_at, server_time = now()
   where id = p_id;
  return jsonb_build_object('ok', true, 'updated_at', p_updated_at);
end;
$$;

revoke all on function public.trip_get(text, text) from public;
revoke all on function public.trip_put(text, text, jsonb, bigint) from public;
grant execute on function public.trip_get(text, text) to anon, authenticated;
grant execute on function public.trip_put(text, text, jsonb, bigint) to anon, authenticated;
