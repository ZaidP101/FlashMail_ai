create table public.formats (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null,
  mode        text not null check (mode in ('email', 'reply')),
  tone        text not null default 'Formal',
  content     text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index formats_user_id_idx on public.formats (user_id);

alter table public.formats enable row level security;

create policy "users can manage own formats" on public.formats
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
