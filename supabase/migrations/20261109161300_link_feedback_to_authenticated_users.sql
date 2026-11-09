begin;

alter table public.growise_feedback_submissions
  add column submitted_by uuid
    references public.growise_profiles (id) on delete set null,
  add column submitted_by_student uuid
    references public.growise_users (id) on delete set null;

comment on column public.growise_feedback_submissions.submitted_by is
  'Authenticated account that submitted the feedback.';

comment on column public.growise_feedback_submissions.submitted_by_student is
  'Verified growise_users record that submitted feedback through the student sign-in flow.';

commit;
