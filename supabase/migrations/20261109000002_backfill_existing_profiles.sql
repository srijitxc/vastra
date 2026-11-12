insert into public.profiles (id, first_name, last_name)
select
  users.id,
  coalesce(users.raw_user_meta_data ->> 'first_name', ''),
  coalesce(users.raw_user_meta_data ->> 'last_name', '')
from auth.users as users
on conflict (id) do nothing;
