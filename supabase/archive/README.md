# Archived Supabase student flows

The archived `student-demo-login` and `student-otp-login` source files are retained for audit/history and are not active deployment targets. The current student flow is `supabase/functions/student-login`.

The legacy `student-demo-login` Edge Function and `public.growise_demo_students` table still exist in the live project. They are unused by the current frontend and must not be deleted until database/function dependencies, backups, and a rollback plan have been reviewed.

Applied migration files remain under `supabase/migrations`; pending username-format and OTP migrations are preserved and must not be applied as part of the current student flow.
