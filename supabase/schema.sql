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

-- 5) Limites maiores na presença: São Paulo passa de 10 milhões de moradores e, com o limite antigo,
--    a linha da cidade era recusada (e junto todo o envio da concorrência). Pode rodar de novo sem problema.
alter table public.presenca drop constraint if exists presenca_limites;
alter table public.presenca add constraint presenca_limites check (
  clients between 0 and 100000000 and homes between 0 and 100000000 and radio >= 0 and fiber >= 0
  and price between 0 and 100000 and rep between 0 and 100 and support between 0 and 1 and mkt between 0 and 1);

-- Conferência: deve listar as 7 colunas de saves e as 15 de presenca.
-- select table_name, column_name, data_type from information_schema.columns
--  where table_schema = 'public' and table_name in ('saves','presenca') order by table_name, ordinal_position;

-- 6) Manutenção (rode sozinho, numa consulta separada, quando o banco estiver lento ou o disco cheio):
--    os saves antigos eram grandes (vários MB, sem compressão) e cada envio deixava a versão anterior ocupando disco.
--    O jogo agora envia o save comprimido ({"gz": ...}, ~17× menor). Este comando devolve o espaço:
-- vacuum full public.saves;
-- Tamanho atual da tabela:
-- select pg_size_pretty(pg_total_relation_size('public.saves'));

-- 7) Regras do jogo editáveis pelo administrador (painel Administração no Menu do jogo).
--    Todos leem; só a conta do administrador grava. Um registro só, id = 'game'; data guarda apenas o que mudou.
create table if not exists public.config (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_by text,
  updated_at timestamptz not null default now()
);
alter table public.config enable row level security;
drop policy if exists config_read on public.config;
drop policy if exists config_insert_admin on public.config;
drop policy if exists config_update_admin on public.config;
create policy config_read on public.config for select to anon, authenticated using (true);
create policy config_insert_admin on public.config for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com');
create policy config_update_admin on public.config for update to authenticated
  using (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com')
  with check (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com');

-- Histórico das mudanças (só o administrador grava e lê).
create table if not exists public.config_log (
  id   bigserial primary key,
  at   timestamptz not null default now(),
  by   text,
  data jsonb
);
alter table public.config_log enable row level security;
drop policy if exists config_log_admin_ins on public.config_log;
drop policy if exists config_log_admin_sel on public.config_log;
create policy config_log_admin_ins on public.config_log for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com');
create policy config_log_admin_sel on public.config_log for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com');

-- 8) Painel do administrador: resumo de cada empresa na tabela saves (o jogo preenche) e leitura de todas pelo admin.
alter table public.saves add column if not exists email    text;
alter table public.saves add column if not exists level    int;
alter table public.saves add column if not exists clients  int;
alter table public.saves add column if not exists coins    bigint;
alter table public.saves add column if not exists diamonds bigint;
alter table public.saves add column if not exists cities   int;
drop policy if exists saves_select_admin on public.saves;
create policy saves_select_admin on public.saves for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com');

-- Comandos do administrador para um jogador (selos, diamantes, dinheiro ou zerar a conta).
-- O jogo do jogador lê os pendentes, aplica e marca applied_at.
create table if not exists public.grants (
  id         bigserial primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  coins      bigint not null default 0,
  diamonds   bigint not null default 0,
  money      numeric not null default 0,
  reset      boolean not null default false,
  note       text,
  created_at timestamptz not null default now(),
  applied_at timestamptz
);
create index if not exists grants_pending on public.grants (user_id) where applied_at is null;
alter table public.grants enable row level security;
drop policy if exists grants_admin_ins on public.grants;
drop policy if exists grants_admin_sel on public.grants;
drop policy if exists grants_own_sel on public.grants;
drop policy if exists grants_own_upd on public.grants;
create policy grants_admin_ins on public.grants for insert to authenticated
  with check (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com');
create policy grants_admin_sel on public.grants for select to authenticated
  using (lower(auth.jwt() ->> 'email') = 'neubeheer@gmail.com');
create policy grants_own_sel on public.grants for select to authenticated using (auth.uid() = user_id);
create policy grants_own_upd on public.grants for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 9) Ranking com todos os jogadores (online ou não, com ou sem outorga).
--    A visão mostra só o resumo público de cada empresa (nunca o progresso nem o e-mail) e todos os logados leem.
create or replace view public.ranking as
  select user_id, company, level, clients, cities, month, updated_at
  from public.saves;
grant select on public.ranking to anon, authenticated;
