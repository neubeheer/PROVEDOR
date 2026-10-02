-- Provedor Tycoon · banco no Supabase
-- Rode este arquivo inteiro no SQL Editor do projeto (uma vez).

-- 1) Progresso de cada jogador (um registro por conta)
create table if not exists public.saves (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  data       jsonb not null,
  company    text,
  month      int,
  saved_at   timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.saves enable row level security;
drop policy if exists saves_select_own on public.saves;
drop policy if exists saves_insert_own on public.saves;
drop policy if exists saves_update_own on public.saves;
create policy saves_select_own on public.saves for select to authenticated using (auth.uid() = user_id);
create policy saves_insert_own on public.saves for insert to authenticated with check (auth.uid() = user_id);
create policy saves_update_own on public.saves for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- (As quadras das cidades ficam no Google Drive, pelo Apps Script. Veja apps-script/Code.gs.)

-- 2) updated_at automático
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists saves_touch on public.saves;
create trigger saves_touch before update on public.saves for each row execute function public.touch_updated_at();
