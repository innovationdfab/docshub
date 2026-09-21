-- DOCHUB COMPLETE DATABASE SETUP

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null,
  document_type text not null,
  file_name text not null,
  storage_path text not null,
  expiry_date date,
  renewal_date date,
  reminder_days integer default 30,
  reminder_enabled boolean default true,
  file_size bigint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents
add column if not exists renewal_date date,
add column if not exists reminder_days integer default 30,
add column if not exists reminder_enabled boolean default true;

alter table public.documents enable row level security;

drop policy if exists "Users can view own documents" on public.documents;
drop policy if exists "Users can insert own documents" on public.documents;
drop policy if exists "Users can update own documents" on public.documents;
drop policy if exists "Users can delete own documents" on public.documents;

create policy "Users can view own documents"
on public.documents
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own documents"
on public.documents
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own documents"
on public.documents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own documents"
on public.documents
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists documents_user_id_idx
on public.documents(user_id);
