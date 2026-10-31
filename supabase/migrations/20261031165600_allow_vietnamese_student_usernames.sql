-- Preserve the existing student profiles while widening username validation.
begin;

alter table public.growise_users
  drop constraint growise_users_username_check;

alter table public.growise_users
  add constraint growise_users_username_check
  check (
    username = lower(btrim(username))
    and username = normalize(username, NFC)
    and length(username) between 3 and 64
    and username ~ '^[a-zàáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]+-[a-z0-9]+$'
  );

commit;
