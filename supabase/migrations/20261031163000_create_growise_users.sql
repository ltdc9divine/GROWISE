-- Unified student profile storage. The existing admin/Auth schema is untouched.

begin;

do $preflight$
begin
  if to_regclass('public.growise_users') is not null then
    raise exception
      'public.growise_users already exists; inspect its schema before applying this migration';
  end if;

  if to_regclass('growise_private.growise_demo_registration_limits') is null
    or to_regprocedure(
      'public.growise_demo_consume_registration_limit(text)'
    ) is null then
    raise exception
      'Required private student rate-limit objects are missing';
  end if;
end;
$preflight$;

create table public.growise_users (
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

create unique index growise_users_username_ci_unique
  on public.growise_users (lower(username));

alter table public.growise_users enable row level security;
revoke all on table public.growise_users
  from public, anon, authenticated;
grant all on table public.growise_users to service_role;

create or replace function growise_private.set_growise_users_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := clock_timestamp();
  return new;
end;
$function$;

revoke all on function growise_private.set_growise_users_updated_at()
  from public, anon, authenticated;
grant execute on function growise_private.set_growise_users_updated_at()
  to service_role;

create trigger growise_users_set_updated_at
before update on public.growise_users
for each row
execute function growise_private.set_growise_users_updated_at();

create or replace function public.growise_consume_student_registration_limit(
  submitted_client_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role is required';
  end if;

  return public.growise_demo_consume_registration_limit(
    submitted_client_hash
  );
end;
$function$;

revoke all on function
  public.growise_consume_student_registration_limit(text)
  from public, anon, authenticated;
grant execute on function
  public.growise_consume_student_registration_limit(text)
  to service_role;

comment on table public.growise_users is
  'Student profiles used by the public name-and-username access flow; not an identity credential.';

commit;
