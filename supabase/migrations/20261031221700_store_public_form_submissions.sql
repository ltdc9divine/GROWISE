begin;

create table public.growise_consultation_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (length(full_name) between 1 and 200),
  email text not null check (length(email) between 3 and 254),
  startup_name text check (startup_name is null or length(startup_name) <= 200),
  industry text not null check (
    industry in (
      'food_beverage',
      'fashion_beauty',
      'education',
      'consumer_products',
      'services',
      'technology',
      'other'
    )
  ),
  monthly_budget text not null check (
    monthly_budget in (
      'undecided',
      'under_500000',
      'vnd_500000_1000000',
      'vnd_1000000_3000000',
      'vnd_3000000_5000000',
      'over_5000000'
    )
  ),
  preferred_method text not null check (
    preferred_method in ('online', 'in_person', 'email_first')
  ),
  preferred_date date,
  preferred_time text not null check (
    preferred_time in ('flexible', 'morning', 'afternoon', 'evening')
  ),
  challenge text not null check (length(challenge) between 1 and 4000),
  created_at timestamptz not null default now()
);

create table public.growise_feedback_submissions (
  id uuid primary key default gen_random_uuid(),
  overall_rating smallint not null check (overall_rating between 1 and 5),
  usability_rating smallint not null check (usability_rating between 1 and 5),
  usefulness_rating smallint not null check (usefulness_rating between 1 and 5),
  marketing_rating smallint not null check (marketing_rating between 1 and 5),
  planner_rating smallint not null check (planner_rating between 1 and 5),
  resources_rating smallint not null check (resources_rating between 1 and 5),
  assistant_rating smallint not null check (assistant_rating between 1 and 5),
  liked text check (liked is null or length(liked) <= 4000),
  improve text check (improve is null or length(improve) <= 4000),
  requested_features text check (
    requested_features is null or length(requested_features) <= 4000
  ),
  created_at timestamptz not null default now()
);

alter table public.growise_consultation_requests
  enable row level security;
alter table public.growise_feedback_submissions
  enable row level security;

revoke all on table public.growise_consultation_requests
  from public, anon, authenticated;
revoke all on table public.growise_feedback_submissions
  from public, anon, authenticated;
grant all on table public.growise_consultation_requests to service_role;
grant all on table public.growise_feedback_submissions to service_role;

create table growise_private.website_form_submission_limits (
  client_hash text primary key check (client_hash ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  request_count smallint not null check (request_count between 1 and 11),
  last_request_at timestamptz not null
);

create index website_form_submission_limits_last_request_idx
  on growise_private.website_form_submission_limits (last_request_at);

revoke all on table growise_private.website_form_submission_limits
  from public, anon, authenticated;
grant all on table growise_private.website_form_submission_limits
  to service_role;

create or replace function public.growise_consume_website_form_limit(
  submitted_client_hash text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  current_request_count smallint;
  v_now timestamptz := clock_timestamp();
begin
  if auth.role() is distinct from 'service_role' then
    raise exception 'Service role is required';
  end if;

  if submitted_client_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'Invalid client hash';
  end if;

  insert into growise_private.website_form_submission_limits (
    client_hash,
    window_started_at,
    request_count,
    last_request_at
  )
  values (
    submitted_client_hash,
    v_now,
    1,
    v_now
  )
  on conflict (client_hash) do update
  set
    window_started_at = case
      when growise_private.website_form_submission_limits.window_started_at
        <= v_now - interval '1 hour' then v_now
      else growise_private.website_form_submission_limits.window_started_at
    end,
    request_count = case
      when growise_private.website_form_submission_limits.window_started_at
        <= v_now - interval '1 hour' then 1
      else least(
        growise_private.website_form_submission_limits.request_count + 1,
        11
      )
    end,
    last_request_at = v_now
  returning request_count into current_request_count;

  delete from growise_private.website_form_submission_limits
  where last_request_at < v_now - interval '1 day'
    and client_hash <> submitted_client_hash;

  return current_request_count <= 10;
end;
$function$;

revoke all on function public.growise_consume_website_form_limit(text)
  from public, anon, authenticated;
grant execute on function public.growise_consume_website_form_limit(text)
  to service_role;

comment on table public.growise_consultation_requests is
  'Public website consultation requests; access through trusted service-role workflows only.';
comment on table public.growise_feedback_submissions is
  'Anonymous public website feedback; access through trusted service-role workflows only.';

commit;
