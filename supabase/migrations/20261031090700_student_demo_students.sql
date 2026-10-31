-- Shared, browser-independent demo student records (migration 20261031090700).
-- These records never create Auth users, sessions, or roles.

begin;

create schema if not exists growise_private;

create table public.growise_demo_students (
  id uuid primary key default gen_random_uuid(),
  full_name text not null
    check (
      full_name = regexp_replace(btrim(full_name), '\s+', ' ', 'g')
      and length(full_name) between 1 and 200
    ),
  username text not null
    check (
      username = lower(btrim(username))
      and length(username) between 3 and 64
      and username ~ '^[a-z]+-[a-z0-9]+$'
    ),
  student_id text not null
    check (
      length(student_id) between 1 and 62
      and student_id = split_part(username, '-', 2)
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index growise_demo_students_username_ci_unique
  on public.growise_demo_students (lower(username));

alter table public.growise_demo_students enable row level security;
revoke all on table public.growise_demo_students
  from public, anon, authenticated;
grant all on table public.growise_demo_students to service_role;

create table growise_private.growise_demo_registration_limits (
  client_hash text primary key
    check (client_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  attempt_count integer not null check (attempt_count > 0),
  updated_at timestamptz not null default now()
);

create index growise_demo_registration_limits_updated_at_idx
  on growise_private.growise_demo_registration_limits (updated_at);

alter table growise_private.growise_demo_registration_limits
  enable row level security;
revoke all on table growise_private.growise_demo_registration_limits
  from public, anon, authenticated;
grant all on table growise_private.growise_demo_registration_limits
  to service_role;

create or replace function public.growise_demo_consume_registration_limit(
  submitted_client_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_window timestamptz := date_trunc('hour', clock_timestamp());
  attempts integer;
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role is required';
  end if;

  if submitted_client_hash is null
    or submitted_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid client key';
  end if;

  insert into growise_private.growise_demo_registration_limits as existing_limit (
    client_hash,
    window_started_at,
    attempt_count,
    updated_at
  )
  values (
    submitted_client_hash,
    current_window,
    1,
    clock_timestamp()
  )
  on conflict (client_hash) do update
  set window_started_at = case
        when existing_limit.window_started_at < current_window
          then current_window
        else existing_limit.window_started_at
      end,
      attempt_count = case
        when existing_limit.window_started_at < current_window then 1
        else existing_limit.attempt_count + 1
      end,
      updated_at = clock_timestamp()
  returning attempt_count into attempts;

  if attempts = 1 then
    delete from growise_private.growise_demo_registration_limits
    where updated_at < clock_timestamp() - interval '7 days'
      and client_hash <> submitted_client_hash;
  end if;

  return attempts <= 120;
end;
$function$;

revoke all on function
  public.growise_demo_consume_registration_limit(text)
  from public, anon, authenticated;
grant execute on function
  public.growise_demo_consume_registration_limit(text)
  to service_role;

commit;
