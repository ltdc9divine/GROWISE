-- Add admin-provisioned student identity fields and the database-only
-- operations required by the email OTP login flow.
-- Existing identities are preserved and are not inferred or auto-enrolled.

begin;

alter table public.growise_profiles
  add column if not exists full_name text,
  add column if not exists student_id text;

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.growise_profiles'::regclass
      and conname = 'growise_profiles_full_name_check'
  ) then
    alter table public.growise_profiles
      add constraint growise_profiles_full_name_check
      check (
        full_name is null
        or (
          full_name = regexp_replace(btrim(full_name), '\s+', ' ', 'g')
          and length(full_name) between 1 and 200
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.growise_profiles'::regclass
      and conname = 'growise_profiles_student_id_check'
  ) then
    alter table public.growise_profiles
      add constraint growise_profiles_student_id_check
      check (
        student_id is null
        or (
          student_id = btrim(student_id)
          and length(student_id) between 1 and 64
        )
      );
  end if;
end;
$constraints$;

comment on column public.growise_profiles.full_name is
  'Admin-provisioned student full name; Vietnamese diacritics are preserved.';
comment on column public.growise_profiles.student_id is
  'Admin-provisioned student identifier; values are not inferred from username.';

create or replace function public.growise_user_has_role(
  target_user_id uuid,
  requested_role text
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $function$
  select
    auth.role() = 'service_role'
    and requested_role in ('student', 'admin')
    and exists (
      select 1
      from growise_private.user_roles as roles
      where roles.user_id = target_user_id
        and roles.role = requested_role
    );
$function$;

revoke all on function public.growise_user_has_role(uuid, text)
  from public, anon, authenticated;
grant execute on function public.growise_user_has_role(uuid, text)
  to service_role;

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
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role is required';
  end if;

  if next_status is distinct from 'rejected' then
    raise exception 'Only locking a student account is allowed';
  end if;

  update public.growise_profiles
  set student_status = 'rejected'
  where id = target_user_id
    and username <> 'admin'
    and student_status in ('pending', 'verified')
    and not exists (
      select 1
      from growise_private.user_roles
      where user_id = target_user_id
        and role = 'admin'
    );

  if not found then
    raise exception 'Student profile not found or not eligible';
  end if;

  delete from growise_private.user_roles
  where user_id = target_user_id
    and role = 'student';
end;
$function$;

revoke all on function public.growise_set_student_status(uuid, text)
  from public, anon, authenticated;
grant execute on function public.growise_set_student_status(uuid, text)
  to service_role;

create or replace function public.growise_provision_student(
  target_user_id uuid,
  student_full_name text,
  student_username text,
  student_number text
)
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role is required';
  end if;

  if student_full_name is null
    or student_full_name <> regexp_replace(btrim(student_full_name), '\s+', ' ', 'g')
    or length(student_full_name) not between 1 and 200
    or student_username is null
    or student_username <> lower(btrim(student_username))
    or student_username = 'admin'
    or length(student_username) > 64
    or student_username !~ '^[a-z]+-[a-z0-9]+$'
    or student_number is null
    or student_number <> btrim(student_number)
    or length(student_number) not between 1 and 64 then
    raise exception 'Invalid student profile';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = target_user_id
  ) then
    raise exception 'Auth user does not exist';
  end if;

  if exists (
    select 1
    from growise_private.user_roles
    where user_id = target_user_id
      and role = 'admin'
  ) then
    raise exception 'Administrator cannot be provisioned as a student';
  end if;

  if exists (
    select 1
    from public.growise_profiles
    where id = target_user_id
  ) then
    update public.growise_profiles
    set username = student_username,
        full_name = student_full_name,
        student_id = student_number,
        student_status = 'verified',
        must_change_password = false
    where id = target_user_id
      and username <> 'admin';
    if not found then
      raise exception 'Administrator profile cannot be provisioned as a student';
    end if;
  else
    insert into public.growise_profiles (
      id,
      username,
      full_name,
      student_id,
      student_status,
      must_change_password
    )
    values (
      target_user_id,
      student_username,
      student_full_name,
      student_number,
      'verified',
      false
    );
  end if;

  insert into growise_private.user_roles (user_id, role)
  values (target_user_id, 'student')
  on conflict (user_id, role) do nothing;
end;
$function$;

revoke all on function
  public.growise_provision_student(uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function
  public.growise_provision_student(uuid, text, text, text)
  to service_role;

commit;
