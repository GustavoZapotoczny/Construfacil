-- ============================================================
-- Construfácil — Schema, RLS e seed (Fase 3)
-- Rode este arquivo no SQL Editor do Supabase (uma vez).
-- ============================================================

-- ---------- Extensões ----------
create extension if not exists "pgcrypto";

-- ============================================================
-- TABELAS
-- ============================================================

-- perfis: estende auth.users
create table if not exists public.perfis (
  id uuid primary key references auth.users on delete cascade,
  nome text,
  telefone text,
  tipo text not null default 'cliente' check (tipo in ('cliente','lojista')),
  criado_em timestamptz not null default now()
);

create table if not exists public.enderecos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references public.perfis on delete cascade,
  apelido text,
  rua text,
  numero text,
  complemento text,
  cidade text,
  cep text,
  latitude float8,
  longitude float8
);

create table if not exists public.lojas (
  id uuid primary key default gen_random_uuid(),
  dono_id uuid not null references public.perfis on delete cascade,
  nome text not null,
  descricao text,
  logo_url text,
  endereco text,
  latitude float8,
  longitude float8,
  nota numeric not null default 0,
  taxa_entrega numeric not null default 0,
  tempo_estimado text,
  raio_entrega_km numeric,
  horario jsonb,
  formas_pagamento text[],
  aberta boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.categorias (
  id text primary key,        -- 'cimento', 'tijolos', ...
  nome text not null,
  emoji text
);

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas on delete cascade,
  categoria_id text references public.categorias,
  nome text not null,
  descricao text,
  foto_url text,
  preco numeric not null default 0,
  unidade text,
  estoque int not null default 0,
  desconto int not null default 0,       -- % de oferta
  disponivel boolean not null default true,
  criado_em timestamptz not null default now()
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references public.perfis on delete cascade,
  cliente_nome text,                 -- snapshot (RLS impede lojista de ler perfis)
  loja_id uuid not null references public.lojas on delete cascade,
  endereco_id uuid references public.enderecos on delete set null,
  endereco_resumo text,              -- snapshot do endereço de entrega
  status text not null default 'Novo'
    check (status in ('Aguardando pagamento','Novo','Em preparo','Pronto','A caminho','Entregue','Concluído','Cancelado')),
  subtotal numeric not null default 0,
  frete numeric not null default 0,
  desconto numeric not null default 0,
  total numeric not null default 0,
  forma_pagamento text,
  cupom_codigo text,
  mp_payment_id text,                -- id do pagamento no Mercado Pago (split)
  repassado boolean not null default false,   -- valor já repassado à loja
  repassado_em timestamptz,
  criado_em timestamptz not null default now()
);

create table if not exists public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos on delete cascade,
  produto_id uuid references public.produtos on delete set null,
  nome text,                         -- snapshot do nome no momento do pedido
  quantidade int not null,
  preco_unitario numeric not null
);

create table if not exists public.cupons (
  id uuid primary key default gen_random_uuid(),
  loja_id uuid not null references public.lojas on delete cascade,
  codigo text not null,
  tipo text not null check (tipo in ('frete','percentual','fixo')),
  valor numeric not null default 0,
  validade text,
  ativo boolean not null default true
);

-- Índices úteis
create index if not exists idx_produtos_loja on public.produtos(loja_id);
create index if not exists idx_pedidos_loja on public.pedidos(loja_id);
create index if not exists idx_pedidos_cliente on public.pedidos(cliente_id);
create index if not exists idx_itens_pedido on public.itens_pedido(pedido_id);
create index if not exists idx_cupons_loja on public.cupons(loja_id);
create index if not exists idx_pedidos_mp_payment on public.pedidos(mp_payment_id);
create index if not exists idx_pedidos_repasse on public.pedidos(loja_id, status, repassado);

-- Cada lojista tem UMA loja (evita duplicadas por corrida no 1º acesso)
create unique index if not exists lojas_uma_por_dono on public.lojas(dono_id);

-- Conexão da conta Mercado Pago de cada loja (split). Tokens SECRETOS: sem
-- policies de RLS (só o servidor, com service_role, acessa).
create table if not exists public.mp_conexoes (
  loja_id uuid primary key references public.lojas on delete cascade,
  mp_user_id text,
  access_token text,
  refresh_token text,
  public_key text,
  conectado_em timestamptz not null default now(),
  atualizado_em timestamptz
);
alter table public.mp_conexoes enable row level security;

-- ============================================================
-- TRIGGER: cria perfil automaticamente no signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.perfis (id, nome, telefone, tipo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'telefone',
    coalesce(new.raw_user_meta_data->>'tipo', 'cliente')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.perfis        enable row level security;
alter table public.enderecos     enable row level security;
alter table public.lojas         enable row level security;
alter table public.categorias    enable row level security;
alter table public.produtos      enable row level security;
alter table public.pedidos       enable row level security;
alter table public.itens_pedido  enable row level security;
alter table public.cupons        enable row level security;

-- ---------- perfis: cada um vê/edita o próprio ----------
drop policy if exists perfis_self_select on public.perfis;
create policy perfis_self_select on public.perfis
  for select using (auth.uid() = id);

drop policy if exists perfis_self_update on public.perfis;
create policy perfis_self_update on public.perfis
  for update using (auth.uid() = id);

drop policy if exists perfis_self_insert on public.perfis;
create policy perfis_self_insert on public.perfis
  for insert with check (auth.uid() = id);

-- ---------- enderecos: do próprio usuário ----------
drop policy if exists enderecos_owner_all on public.enderecos;
create policy enderecos_owner_all on public.enderecos
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());

-- ---------- categorias: leitura pública ----------
drop policy if exists categorias_public_read on public.categorias;
create policy categorias_public_read on public.categorias
  for select using (true);

-- ---------- lojas: leitura pública; dono gerencia a própria ----------
drop policy if exists lojas_public_read on public.lojas;
create policy lojas_public_read on public.lojas
  for select using (true);

drop policy if exists lojas_owner_write on public.lojas;
create policy lojas_owner_write on public.lojas
  for all using (dono_id = auth.uid()) with check (dono_id = auth.uid());

-- ---------- produtos: leitura pública; dono da loja gerencia ----------
drop policy if exists produtos_public_read on public.produtos;
create policy produtos_public_read on public.produtos
  for select using (true);

drop policy if exists produtos_owner_write on public.produtos;
create policy produtos_owner_write on public.produtos
  for all using (
    exists (select 1 from public.lojas l where l.id = loja_id and l.dono_id = auth.uid())
  ) with check (
    exists (select 1 from public.lojas l where l.id = loja_id and l.dono_id = auth.uid())
  );

-- ---------- cupons: leitura pública (validação no checkout); dono gerencia ----------
drop policy if exists cupons_public_read on public.cupons;
create policy cupons_public_read on public.cupons
  for select using (true);

drop policy if exists cupons_owner_write on public.cupons;
create policy cupons_owner_write on public.cupons
  for all using (
    exists (select 1 from public.lojas l where l.id = loja_id and l.dono_id = auth.uid())
  ) with check (
    exists (select 1 from public.lojas l where l.id = loja_id and l.dono_id = auth.uid())
  );

-- ---------- pedidos: cliente vê os seus; lojista vê os da sua loja ----------
drop policy if exists pedidos_cliente_select on public.pedidos;
create policy pedidos_cliente_select on public.pedidos
  for select using (cliente_id = auth.uid());

drop policy if exists pedidos_lojista_select on public.pedidos;
create policy pedidos_lojista_select on public.pedidos
  for select using (
    exists (select 1 from public.lojas l where l.id = loja_id and l.dono_id = auth.uid())
  );

-- cliente cria pedido só como não-pago: 'Aguardando pagamento' (Pix/cartão)
-- ou 'Novo' apenas quando paga na entrega (sem pagamento online a confirmar)
drop policy if exists pedidos_cliente_insert on public.pedidos;
create policy pedidos_cliente_insert on public.pedidos
  for insert with check (
    cliente_id = auth.uid()
    and (
      status = 'Aguardando pagamento'
      or (status = 'Novo' and forma_pagamento = 'entrega')
    )
  );

-- cliente e lojista podem editar o próprio pedido; QUAIS transições de status
-- cada um pode fazer é validado pelo trigger pedido_transicao_valida (abaixo).
drop policy if exists pedidos_cliente_update on public.pedidos;
create policy pedidos_cliente_update on public.pedidos
  for update using (cliente_id = auth.uid())
  with check (cliente_id = auth.uid());

drop policy if exists pedidos_lojista_update on public.pedidos;
create policy pedidos_lojista_update on public.pedidos
  for update using (
    exists (select 1 from public.lojas l where l.id = loja_id and l.dono_id = auth.uid())
  );

-- Trava de transições de status (escrow), baseada na TRANSIÇÃO (não em quem
-- age) — funciona inclusive quando o dono da loja compra da própria loja:
--  • pedido "Aguardando pagamento" só vira "Cancelado" (pago é só via servidor);
--  • "Concluído" (libera o cofre) só a partir de "Entregue" (comprador confirma);
--  • ninguém volta para "Aguardando pagamento"; service_role é livre.
create or replace function public.pedido_transicao_valida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;
  if new.status is not distinct from old.status then
    return new;
  end if;
  if old.status = 'Aguardando pagamento' and new.status <> 'Cancelado' then
    raise exception
      'Pedido aguardando pagamento so pode ser cancelado (% -> %)',
      old.status, new.status;
  end if;
  if new.status = 'Aguardando pagamento' then
    raise exception 'Nao e possivel voltar para Aguardando pagamento';
  end if;
  if new.status = 'Concluído' and old.status <> 'Entregue' then
    raise exception
      'So e possivel concluir (liberar) um pedido que foi entregue (% -> %)',
      old.status, new.status;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_pedido_transicao on public.pedidos;
create trigger trg_pedido_transicao
  before update on public.pedidos
  for each row execute function public.pedido_transicao_valida();

-- ---------- itens_pedido: seguem a dona do pedido ----------
drop policy if exists itens_select on public.itens_pedido;
create policy itens_select on public.itens_pedido
  for select using (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_id
        and (
          p.cliente_id = auth.uid()
          or exists (select 1 from public.lojas l where l.id = p.loja_id and l.dono_id = auth.uid())
        )
    )
  );

-- itens só entram enquanto o pedido ainda não está pago
drop policy if exists itens_insert on public.itens_pedido;
create policy itens_insert on public.itens_pedido
  for insert with check (
    exists (
      select 1 from public.pedidos p
      where p.id = pedido_id
        and p.cliente_id = auth.uid()
        and (
          p.status = 'Aguardando pagamento'
          or (p.status = 'Novo' and p.forma_pagamento = 'entrega')
        )
    )
  );

-- ============================================================
-- STORAGE: bucket público para fotos de produto
-- ============================================================
insert into storage.buckets (id, name, public)
values ('produtos', 'produtos', true)
on conflict (id) do nothing;

-- leitura pública das fotos
drop policy if exists produtos_storage_read on storage.objects;
create policy produtos_storage_read on storage.objects
  for select using (bucket_id = 'produtos');

-- upload/edição apenas por usuários autenticados (lojistas)
drop policy if exists produtos_storage_write on storage.objects;
create policy produtos_storage_write on storage.objects
  for insert to authenticated with check (bucket_id = 'produtos');

drop policy if exists produtos_storage_update on storage.objects;
create policy produtos_storage_update on storage.objects
  for update to authenticated using (bucket_id = 'produtos');

-- ============================================================
-- SEED: categorias fixas
-- ============================================================
insert into public.categorias (id, nome, emoji) values
  ('cimento',     'Cimento & Argamassa',     '🧱'),
  ('tijolos',     'Tijolos & Blocos',        '🟫'),
  ('tintas',      'Tintas',                  '🎨'),
  ('ferramentas', 'Ferramentas',             '🔧'),
  ('eletrica',    'Elétrica',                '💡'),
  ('hidraulica',  'Hidráulica',              '🚰'),
  ('pisos',       'Pisos & Revestimentos',   '🪟'),
  ('madeiras',    'Madeiras',                '🪵'),
  ('telhas',      'Telhas',                  '🏠'),
  ('ferragens',   'Ferragens',               '⚙️'),
  ('epi',         'EPI & Segurança',         '🦺'),
  ('jardinagem',  'Jardinagem',              '🌱')
on conflict (id) do nothing;
