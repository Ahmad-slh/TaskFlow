-- TaskFlow: add a `started_at` timestamp so we can measure how long a ticket
-- took from "In Progress" (start working) to "Done".
-- Run in Supabase Dashboard → SQL Editor. Must be applied before the app code
-- that writes `started_at`, otherwise the status UPDATE is rejected.

alter table public.tickets
  add column if not exists started_at timestamptz;
