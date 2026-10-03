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
-- sessão do aparelho que está jogando (um aparelho por vez)
alter table public.saves add column if not exists sess text;
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

-- 3) Concorrência entre jogadores: resumo de cada jogador em cada cidade que atende.
--    Todos os jogadores logados leem (para disputar a cidade); cada um só grava e apaga as próprias linhas.
create table if not exists public.presenca (
  user_id    uuid not null references auth.users(id) on delete cascade,
  city_code  text not null,          -- código IBGE do município
  city_name  text,
  uf         text,
  company    text,
  clients    int     not null default 0,
  homes      int     not null default 0,
  radio      int     not null default 0,
  fiber      int     not null default 0,
  price      numeric not null default 0,   -- ticket médio (R$)
  rep        numeric not null default 50,  -- reputação 0-100
  support    numeric not null default 0,   -- atendimento 0-1
  mkt        numeric not null default 0,   -- impulso de marketing 0-0,33
  updated_at timestamptz not null default now(),
  primary key (user_id, city_code),
  constraint presenca_limites check (
    clients between 0 and 10000000 and homes between 0 and 10000000 and radio >= 0 and fiber >= 0
    and price between 0 and 10000 and rep between 0 and 100 and support between 0 and 1 and mkt between 0 and 1)
);
create index if not exists presenca_city on public.presenca (city_code, updated_at desc);
alter table public.presenca enable row level security;
drop policy if exists presenca_select_all on public.presenca;
drop policy if exists presenca_insert_own on public.presenca;
drop policy if exists presenca_update_own on public.presenca;
drop policy if exists presenca_delete_own on public.presenca;
create policy presenca_select_all on public.presenca for select to authenticated using (true);
create policy presenca_insert_own on public.presenca for insert to authenticated with check (auth.uid() = user_id);
create policy presenca_update_own on public.presenca for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy presenca_delete_own on public.presenca for delete to authenticated using (auth.uid() = user_id);

-- 4) Infraestrutura no mapa dos rivais: torres (posição, leque, alcance) e caixas CTO. Até ~30 KB por cidade.
alter table public.presenca add column if not exists infra jsonb not null default '{}'::jsonb;
alter table public.presenca drop constraint if exists presenca_infra_tamanho;
alter table public.presenca add constraint presenca_infra_tamanho check (pg_column_size(infra) < 30000);
