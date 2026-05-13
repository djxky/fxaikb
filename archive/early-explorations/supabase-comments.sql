-- Supabase schema for the shared Pin comments demo.
-- Run this in Supabase SQL Editor, then enable Realtime for both tables
-- from Database > Replication if your project does not apply the publication
-- statements below automatically.

create extension if not exists pgcrypto;

create table if not exists public.comment_pins (
  id text primary key,
  page_key text not null,
  selector text not null,
  x_pct double precision not null check (x_pct >= 0 and x_pct <= 1),
  y_pct double precision not null check (y_pct >= 0 and y_pct <= 1),
  is_fixed boolean not null default false,
  status text not null default 'todo' check (status in ('todo', 'fixed', 'confirmed', 'wontfix')),
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.comment_messages (
  id uuid primary key default gen_random_uuid(),
  pin_id text not null references public.comment_pins(id) on delete cascade,
  page_key text not null,
  author text not null,
  body text not null check (char_length(body) <= 500),
  created_at timestamptz not null default now()
);

create index if not exists comment_pins_page_key_created_at_idx
  on public.comment_pins (page_key, created_at);

create index if not exists comment_messages_pin_id_created_at_idx
  on public.comment_messages (pin_id, created_at);

create or replace function public.set_comment_pin_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_comment_pin_updated_at on public.comment_pins;
create trigger set_comment_pin_updated_at
before update on public.comment_pins
for each row execute function public.set_comment_pin_updated_at();

alter table public.comment_pins enable row level security;
alter table public.comment_messages enable row level security;

alter table public.comment_pins replica identity full;
alter table public.comment_messages replica identity full;

drop policy if exists "anon can read comment pins" on public.comment_pins;
create policy "anon can read comment pins"
on public.comment_pins for select
to anon
using (true);

drop policy if exists "anon can insert comment pins" on public.comment_pins;
create policy "anon can insert comment pins"
on public.comment_pins for insert
to anon
with check (
  length(trim(created_by)) between 1 and 40
  and length(trim(selector)) > 0
);

drop policy if exists "anon can update comment pin status" on public.comment_pins;
create policy "anon can update comment pin status"
on public.comment_pins for update
to anon
using (true)
with check (status in ('todo', 'fixed', 'confirmed', 'wontfix'));

drop policy if exists "anon can delete comment pins" on public.comment_pins;
create policy "anon can delete comment pins"
on public.comment_pins for delete
to anon
using (true);

drop policy if exists "anon can read comment messages" on public.comment_messages;
create policy "anon can read comment messages"
on public.comment_messages for select
to anon
using (true);

drop policy if exists "anon can insert comment messages" on public.comment_messages;
create policy "anon can insert comment messages"
on public.comment_messages for insert
to anon
with check (
  length(trim(author)) between 1 and 40
  and length(trim(body)) between 1 and 500
);

drop policy if exists "anon can delete comment messages" on public.comment_messages;
create policy "anon can delete comment messages"
on public.comment_messages for delete
to anon
using (true);

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comment_pins'
  ) then
    alter publication supabase_realtime add table public.comment_pins;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'comment_messages'
  ) then
    alter publication supabase_realtime add table public.comment_messages;
  end if;
end;
$$;
