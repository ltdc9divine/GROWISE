
-- GROWISE authentication foundation
-- Review before applying to a live Supabase project.
-- This migration does not create Auth users or seed credentials.

begin;

-- =========================================================
-- 1. PRIVATE SCHEMA
-- =========================================================

create schema if not exists growise_private;

revoke all on schema growise_private
  from public, anon, authenticated;

grant usage on schema growise_private to service_role;

-- =========================================================
-- 2. USER PROFILES
-- =========================================================

create table if not exists public.growise_profiles (
  id uuid primary key
    references auth.users (id) on delete cascade,

  username text not null
    check (
      username = lower(btrim(username))
      and length(username) between 1 and 64
      and (username = 'admin' or username ~ '^[a-z]+-[a-z0-9]+$')
    ),

  student_status text not null default 'pending'
    check (
      student_status in (
        'pending',
        'verified',
        'rejected',
        'not_applicable'
      )
    ),

  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists
  growise_profiles_username_ci_unique
  on public.growise_profiles (lower(username));

alter table public.growise_profiles enable row level security;

revoke all on table public.growise_profiles
  from public, anon, authenticated;

grant select on table public.growise_profiles
  to authenticated;

grant all on table public.growise_profiles
  to service_role;

-- Recreate the own-profile SELECT policy safely.
drop policy if exists growise_profiles_select_own
  on public.growise_profiles;

create policy growise_profiles_select_own
  on public.growise_profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

-- =========================================================
-- 3. PROFILE CREATION TRIGGER
-- =========================================================

create or replace function
  growise_private.create_growise_profile_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  submitted_username text :=
    new.raw_user_meta_data ->> 'username';
begin
  -- Auth users without a GROWISE username are ignored.
  if submitted_username is null then
    return new;
  end if;

  if submitted_username <> lower(btrim(submitted_username))
    or submitted_username = 'admin'
    or submitted_username !~ '^[a-z]+-[a-z0-9]+$'
    or length(submitted_username) > 64 then
    raise exception 'Invalid GROWISE username';
  end if;

  insert into public.growise_profiles (
    id,
    username,
    student_status
  )
  values (
    new.id,
    submitted_username,
    'pending'
  );

  return new;
end;
$function$;

revoke all on function
  growise_private.create_growise_profile_for_auth_user()
  from public, anon, authenticated, service_role;

drop trigger if exists growise_create_profile_after_auth_signup
  on auth.users;

create trigger growise_create_profile_after_auth_signup
  after insert on auth.users
  for each row
  execute function
    growise_private.create_growise_profile_for_auth_user();

-- =========================================================
-- 4. PRIVATE USER ROLES
-- =========================================================

create table if not exists growise_private.user_roles (
  user_id uuid not null
    references auth.users (id) on delete cascade,

  role text not null
    check (role in ('student', 'admin')),

  created_at timestamptz not null default now(),

  primary key (user_id, role)
);

alter table growise_private.user_roles enable row level security;

revoke all on table growise_private.user_roles
  from public, anon, authenticated;

grant all on table growise_private.user_roles
  to service_role;

-- =========================================================
-- 5. CHECK CURRENT USER ROLE
-- =========================================================

create or replace function public.growise_has_role(
  requested_role text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    requested_role in ('student', 'admin')
    and exists (
      select 1
      from growise_private.user_roles as roles
      where roles.user_id = (select auth.uid())
        and roles.role = requested_role
    );
$function$;

revoke all on function public.growise_has_role(text)
  from public, anon;

grant execute on function public.growise_has_role(text)
  to authenticated;

-- =========================================================
-- 6. ADMIN-ONLY BACKEND: UPDATE STUDENT STATUS
-- =========================================================

create or replace function public.growise_set_student_status(
  target_user_id uuid,
  next_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if next_status is null
    or next_status not in ('verified', 'rejected') then
    raise exception 'Invalid student status';
  end if;

  update public.growise_profiles
  set student_status = next_status
  where id = target_user_id
    and student_status = 'pending'
    and username <> 'admin'
    and exists (
      select 1
      from auth.users as auth_user
      where auth_user.id = target_user_id
        and auth_user.email_confirmed_at is not null
    );

  if not found then
    raise exception 'Student profile not found or not eligible';
  end if;

  if next_status = 'verified' then
    insert into growise_private.user_roles (
      user_id,
      role
    )
    values (
      target_user_id,
      'student'
    )
    on conflict (user_id, role) do nothing;
  else
    delete from growise_private.user_roles
    where user_id = target_user_id
      and role = 'student';
  end if;
end;
$function$;

revoke all on function
  public.growise_set_student_status(uuid, text)
  from public, anon, authenticated;

grant execute on function
  public.growise_set_student_status(uuid, text)
  to service_role;

-- =========================================================
-- 7. ONE-TIME ADMIN BOOTSTRAP
-- =========================================================

create or replace function public.growise_bootstrap_admin(
  target_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if not exists (
    select 1
    from auth.users as auth_user
    where auth_user.id = target_user_id
      and auth_user.email_confirmed_at is not null
  ) then
    raise exception 'A confirmed Auth user is required';
  end if;

  if exists (
    select 1
    from public.growise_profiles
    where username = 'admin'
  ) or exists (
    select 1
    from growise_private.user_roles
    where role = 'admin'
  ) or exists (
    select 1
    from public.growise_profiles
    where id = target_user_id
  ) then
    raise exception
      'GROWISE admin is already provisioned or user already has a profile';
  end if;

  insert into public.growise_profiles (
    id,
    username,
    student_status,
    must_change_password
  )
  values (
    target_user_id,
    'admin',
    'not_applicable',
    true
  );

  insert into growise_private.user_roles (
    user_id,
    role
  )
  values (
    target_user_id,
    'admin'
  );
end;
$function$;

revoke all on function
  public.growise_bootstrap_admin(uuid)
  from public, anon, authenticated;

grant execute on function
  public.growise_bootstrap_admin(uuid)
  to service_role;

commit;
