-- TaskFlow: customers, new ticket fields (customer_id, due_date, estimated_hours),
-- 'Critical' priority, ticket activity log, and realtime.
-- Run in Supabase Dashboard -> SQL Editor BEFORE deploying the matching app code.

-- 1. Customers -------------------------------------------------------------
create table if not exists public.customers (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  company        text,
  phone          text,
  email          text,
  address        text,
  city           text,
  contact_person text,
  notes          text,
  status         text not null default 'Active' check (status in ('Active', 'Inactive')),
  created_by     uuid references public.profiles(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.customers enable row level security;

-- Everyone signed in can read (developers see the customer name on tickets).
create policy "Authenticated can read customers"
  on public.customers for select
  to authenticated
  using (true);

-- Only employees can add / edit customers.
create policy "Employees can insert customers"
  on public.customers for insert
  to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

create policy "Employees can update customers"
  on public.customers for update
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'employee'));

-- 2. New ticket columns ----------------------------------------------------
alter table public.tickets
  add column if not exists customer_id     uuid references public.customers(id) on delete set null,
  add column if not exists due_date        date,
  add column if not exists estimated_hours numeric(6,2) check (estimated_hours is null or estimated_hours >= 0);

create index if not exists tickets_customer_id_idx on public.tickets(customer_id);

-- 3. Allow 'Critical' priority --------------------------------------------
-- Diagnostic: shows the existing priority check constraint (if any).
-- select conname, pg_get_constraintdef(oid) from pg_constraint
--  where conrelid = 'public.tickets'::regclass and contype = 'c';
alter table public.tickets drop constraint if exists tickets_priority_check;
alter table public.tickets
  add constraint tickets_priority_check
  check (priority in ('Low', 'Medium', 'High', 'Critical'));

-- 4. Activity log ----------------------------------------------------------
create table if not exists public.ticket_activity (
  id         uuid primary key default gen_random_uuid(),
  ticket_id  uuid not null references public.tickets(id) on delete cascade,
  actor_id   uuid references public.profiles(id) on delete set null,
  action     text not null,   -- created | status_changed | reassigned | priority_changed | due_date_changed | edited
  old_value  text,
  new_value  text,
  created_at timestamptz not null default now()
);

create index if not exists ticket_activity_ticket_idx on public.ticket_activity(ticket_id, created_at);

alter table public.ticket_activity enable row level security;

create policy "Creator or assignee can read activity"
  on public.ticket_activity for select
  to authenticated
  using (exists (
    select 1 from public.tickets t
    where t.id = ticket_activity.ticket_id
      and (t.created_by = auth.uid() or t.assigned_to = auth.uid())
  ));
-- No insert/update/delete policies: rows are written only by the trigger below.

-- 5. Trigger that records changes -----------------------------------------
create or replace function public.log_ticket_activity()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into ticket_activity (ticket_id, actor_id, action, new_value)
    values (new.id, auth.uid(), 'created', new.status);
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into ticket_activity (ticket_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'status_changed', old.status, new.status);
  end if;

  if new.assigned_to is distinct from old.assigned_to then
    insert into ticket_activity (ticket_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'reassigned',
            (select name from profiles where id = old.assigned_to),
            (select name from profiles where id = new.assigned_to));

    -- Notify the new assignee (mirrors the existing on-insert notification).
    if new.assigned_to is not null and new.assigned_to is distinct from auth.uid() then
      insert into notifications (user_id, ticket_id, message)
      values (new.assigned_to, new.id, 'Ticket ' || coalesce(new.ticket_number, '') || ' was assigned to you');
    end if;
  end if;

  if new.priority is distinct from old.priority then
    insert into ticket_activity (ticket_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'priority_changed', old.priority, new.priority);
  end if;

  if new.due_date is distinct from old.due_date then
    insert into ticket_activity (ticket_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'due_date_changed', old.due_date::text, new.due_date::text);
  end if;

  if new.title is distinct from old.title or new.description is distinct from old.description then
    insert into ticket_activity (ticket_id, actor_id, action)
    values (new.id, auth.uid(), 'edited');
  end if;

  return new;
end;
$$;

drop trigger if exists ticket_activity_trigger on public.tickets;
create trigger ticket_activity_trigger
  after insert or update on public.tickets
  for each row execute function public.log_ticket_activity();

-- 6. Realtime --------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['tickets', 'ticket_activity', 'comments'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
