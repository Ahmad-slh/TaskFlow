-- TaskFlow: backfill profiles + set roles for users created without metadata.
-- Run in Supabase Dashboard → SQL Editor. EDIT THE EMAILS in step 3.

-- 1. Ensure every auth user has a profile row (no-op if it already exists).
insert into public.profiles (id, name, role)
select u.id,
       coalesce(u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1)),
       coalesce(u.raw_user_meta_data ->> 'role', 'employee')
from auth.users u
on conflict (id) do nothing;

-- 2. Inspect: map email -> profile so you know which to make a developer.
select p.id, u.email, p.name, p.role
from public.profiles p
join auth.users u on u.id = p.id
order by u.email;

-- 3. Set roles explicitly (EDIT the email addresses below).
update public.profiles
set role = 'employee'
where id = (select id from auth.users where email = 'aabuarra90@gmail.com');

update public.profiles
set role = 'developer'
where id = (select id from auth.users where email = 'REPLACE_WITH_DEVELOPER_EMAIL');

-- 4. Verify.
select p.id, u.email, p.name, p.role
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, u.email;
