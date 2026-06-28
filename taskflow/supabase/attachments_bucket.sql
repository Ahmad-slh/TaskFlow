-- TaskFlow: create the public "attachments" storage bucket + access policies.
-- Run this in the Supabase Dashboard → SQL Editor (it runs with admin privileges there).

-- 1. Create the bucket (public so getPublicUrl download links work).
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do update set public = true;

-- 2. Allow authenticated users to upload files into the bucket.
create policy "Authenticated can upload attachments"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'attachments');

-- 3. Allow public read access (bucket is public; download via public URL).
create policy "Public can read attachments"
  on storage.objects for select
  to public
  using (bucket_id = 'attachments');

-- 4. (Optional) Allow uploaders to delete their own files.
create policy "Owners can delete their attachments"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'attachments' and owner = auth.uid());
