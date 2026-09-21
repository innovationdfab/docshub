-- DOCHUB HISTORY TABLE

create table if not exists public.document_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_id uuid,
  action text not null,
  document_name text,
  person_name text,
  document_type text,
  created_at timestamptz not null default now()
);

alter table public.document_history enable row level security;

drop policy if exists "Users can view own history" on public.document_history;
drop policy if exists "Users can insert own history" on public.document_history;
drop policy if exists "Users can delete own history" on public.document_history;

create policy "Users can view own history"
on public.document_history
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own history"
on public.document_history
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can delete own history"
on public.document_history
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists document_history_user_id_idx
on public.document_history(user_id);
