-- TaskFlow: let users edit their own profile (name) but never change their own role.
--
-- The existing policy "Users can update own profile" allows updating ANY column of the
-- caller's own row, which would let an employee promote themselves to developer.
-- This trigger blocks role changes made through the API (where auth.uid() is set).
-- Changes made from the Supabase dashboard / SQL editor / service role (auth.uid() is null)
-- are still allowed, so fix_roles.sql keeps working.
-- Run in Supabase Dashboard -> SQL Editor.

create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and auth.uid() is not null then
    raise exception 'Changing role is not allowed' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_protect_role on public.profiles;
create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.prevent_role_change();
