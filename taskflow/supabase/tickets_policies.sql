-- TaskFlow: RLS policies + sanity checks for the ticket-creation flow.
-- Run in Supabase Dashboard → SQL Editor. Apply the policies that are missing
-- (the exact failure shows in the browser console/network when creating a ticket).

-- Ensure RLS is on (it should already be).
alter table public.tickets   enable row level security;
alter table public.profiles  enable row level security;

-- 1. Employees can INSERT tickets they own.
create policy "Authenticated can create own tickets"
  on public.tickets for insert
  to authenticated
  with check (created_by = auth.uid());

-- 2. Creator or assignee can SELECT a ticket.
--    Required so `.insert(...).select('id, ticket_number')` returns the new row.
create policy "Creator or assignee can read tickets"
  on public.tickets for select
  to authenticated
  using (created_by = auth.uid() or assigned_to = auth.uid());

-- 3. Creator or assignee can UPDATE (status changes / cancel).
create policy "Creator or assignee can update tickets"
  on public.tickets for update
  to authenticated
  using (created_by = auth.uid() or assigned_to = auth.uid())
  with check (created_by = auth.uid() or assigned_to = auth.uid());

-- 4. Any authenticated user can read profiles (needed for the "Assign To"
--    developer dropdown and creator/assignee names).
create policy "Authenticated can read profiles"
  on public.profiles for select
  to authenticated
  using (true);

-- ---------------------------------------------------------------------------
-- Diagnostics — run these SELECTs to confirm the backend expectations.
-- ---------------------------------------------------------------------------

-- a) Is `ticket_number` nullable / does it have a default or generating trigger?
--    If it is NOT NULL with no default and no BEFORE INSERT trigger, inserts fail.
select column_name, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'tickets'
  and column_name = 'ticket_number';

-- b) List triggers on tickets (expect a BEFORE INSERT for ticket_number and an
--    AFTER INSERT that creates the assignee notification).
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.tickets'::regclass and not tgisinternal;
