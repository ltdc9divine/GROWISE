-- Manual, one-time migration: canonicalize existing name.MSSV usernames as
-- name-mssv. Review the project and run this only after taking a database
-- backup. The transaction aborts before changing data if it finds invalid or
-- conflicting usernames. It does not create/delete Auth users or roles.
-- The locks pause Auth writes and all profile access until commit. If this
-- transaction fails, PostgreSQL rolls back the changes. After commit, rollback
-- requires a separately reviewed migration using the retained mapping table.

begin;

do $prerequisites$
begin
  if to_regclass('auth.users') is null then
    raise exception 'Prerequisite missing: auth.users';
  end if;

  if to_regclass('public.growise_profiles') is null then
    raise exception 'Prerequisite missing: public.growise_profiles';
  end if;

  if to_regnamespace('growise_private') is null then
    raise exception 'Prerequisite missing: schema growise_private';
  end if;
end;
$prerequisites$;

-- Acquire locks in signup order: auth.users first, then growise_profiles.
-- This blocks signups/account writes and profile reads/writes during cutover.
lock table auth.users in share row exclusive mode;
lock table public.growise_profiles in access exclusive mode;

do $preflight$
declare
  username_check_expression text;
begin
  if to_regclass('growise_private.username_migration_20261031') is not null then
    raise exception
      'Migration already applied: growise_private.username_migration_20261031 exists';
  end if;

  if not exists (
    select 1
    from pg_constraint as constraint_info
    where constraint_info.conrelid = 'public.growise_profiles'::regclass
      and constraint_info.conname = 'growise_profiles_username_check'
      and constraint_info.contype = 'c'
      and constraint_info.convalidated
  ) then
    raise exception
      'Expected validated check constraint public.growise_profiles.growise_profiles_username_check';
  end if;

  select regexp_replace(
    replace(
      replace(
        replace(
          pg_get_expr(constraint_info.conbin, constraint_info.conrelid),
          '::text',
          ''
        ),
        'E' || chr(39),
        chr(39)
      ),
      chr(92) || chr(92),
      chr(92)
    ),
    '[[:space:]()]',
    '',
    'g'
  )
  into username_check_expression
  from pg_constraint as constraint_info
  where constraint_info.conrelid = 'public.growise_profiles'::regclass
    and constraint_info.conname = 'growise_profiles_username_check'
    and constraint_info.contype = 'c'
    and constraint_info.convalidated;

  if username_check_expression is distinct from
      (
        'username=lowerbtrimusernameANDlengthusername>=1ANDlengthusername<=64ANDusername=''admin''ORusername~''^[a-z]+'
        || chr(92)
        || '.[a-z0-9]+$'''
      )
    and username_check_expression is distinct from
      (
        'username=lowerbtrimusernameANDlengthusername>=1ANDlengthusername<=64ANDusername~''^[a-z]+'
        || chr(92)
        || '.[a-z0-9]+$|^admin$'''
      )
    and username_check_expression is distinct from
      'username=lowerbtrimusernameANDlengthusername>=1ANDlengthusername<=64ANDusername=''admin''ORusername~''^[a-z]+-[a-z0-9]+$''' then
    raise exception
      'Expected username constraint to match exactly the known legacy or canonical schema; found: %',
      coalesce(username_check_expression, '<missing>');
  end if;

  if not exists (
    select 1
    from pg_index as index_info
    join pg_class as index_relation
      on index_relation.oid = index_info.indexrelid
    join pg_namespace as index_schema
      on index_schema.oid = index_relation.relnamespace
    where index_schema.nspname = 'public'
      and index_relation.relname = 'growise_profiles_username_ci_unique'
      and index_info.indrelid = 'public.growise_profiles'::regclass
      and index_info.indisunique
      and index_info.indisvalid
      and index_info.indisready
      and index_info.indpred is null
      and index_info.indnkeyatts = 1
      and index_info.indnatts = 1
      and pg_get_expr(index_info.indexprs, index_info.indrelid)
        = 'lower(username)'
  ) then
    raise exception
      'Expected valid unique expression index public.growise_profiles_username_ci_unique on lower(username)';
  end if;

  if not exists (
    select 1
    from pg_trigger as trigger_info
    join pg_proc as trigger_function
      on trigger_function.oid = trigger_info.tgfoid
    join pg_namespace as function_schema
      on function_schema.oid = trigger_function.pronamespace
    where trigger_info.tgrelid = 'auth.users'::regclass
      and trigger_info.tgname = 'growise_create_profile_after_auth_signup'
      and not trigger_info.tgisinternal
      and trigger_info.tgenabled in ('O', 'A')
      and trigger_info.tgtype = 5
      and trigger_info.tgqual is null
      and function_schema.nspname = 'growise_private'
      and trigger_function.proname =
        'create_growise_profile_for_auth_user'
  ) then
    raise exception
      'Expected enabled AFTER INSERT row trigger auth.users.growise_create_profile_after_auth_signup';
  end if;

  if exists (
    select 1
    from public.growise_profiles
    where username <> lower(btrim(username))
      or (
        username <> 'admin'
        and username !~ '^[a-z]+\.[a-z0-9]+$'
        and username !~ '^[a-z]+-[a-z0-9]+$'
      )
  ) then
    raise exception
      'Migration stopped: profile usernames include an unsupported format';
  end if;

  if exists (
    select 1
    from (
      select lower(
        case
          when username ~ '^[a-z]+\.[a-z0-9]+$'
            then replace(username, '.', '-')
          else username
        end
      ) as target_username
      from public.growise_profiles
    ) as mapped
    group by target_username
    having count(*) > 1
  ) then
    raise exception
      'Migration stopped: legacy usernames conflict with each other or an existing hyphen username';
  end if;
end;
$preflight$;

create table growise_private.username_migration_20261031 (
  user_id uuid primary key,
  old_username text not null unique,
  new_username text not null unique,
  migrated_at timestamptz not null default now()
);

comment on table growise_private.username_migration_20261031 is
  'Retained audit and rollback mapping for GROWISE username format migration 20261031; rows intentionally survive Auth user deletion.';

revoke all on table growise_private.username_migration_20261031
  from public, anon, authenticated;
grant all on table growise_private.username_migration_20261031
  to service_role;

insert into growise_private.username_migration_20261031 (
  user_id,
  old_username,
  new_username
)
select
  id,
  username,
  replace(username, '.', '-')
from public.growise_profiles
where username ~ '^[a-z]+\.[a-z0-9]+$';

do $temporary_name_check$
begin
  if exists (
    select 1
    from growise_private.username_migration_20261031 as mapping
    join public.growise_profiles as profile
      on lower(profile.username) =
        lower('legacy-' || replace(mapping.user_id::text, '-', ''))
      and profile.id <> mapping.user_id
  ) then
    raise exception
      'Migration stopped: an internal temporary username would collide';
  end if;
end;
$temporary_name_check$;

alter table public.growise_profiles
  drop constraint growise_profiles_username_check;

update public.growise_profiles as profile
set username = 'legacy-' || replace(profile.id::text, '-', '')
from growise_private.username_migration_20261031 as mapping
where profile.id = mapping.user_id;

update public.growise_profiles as profile
set username = mapping.new_username
from growise_private.username_migration_20261031 as mapping
where profile.id = mapping.user_id;

update auth.users as auth_user
set raw_user_meta_data =
  coalesce(auth_user.raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('username', mapping.new_username)
from growise_private.username_migration_20261031 as mapping
where auth_user.id = mapping.user_id;

alter table public.growise_profiles
  add constraint growise_profiles_username_check
  check (
    username = lower(btrim(username))
    and length(username) between 1 and 64
    and (username = 'admin' or username ~ '^[a-z]+-[a-z0-9]+$')
  );

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

commit;
