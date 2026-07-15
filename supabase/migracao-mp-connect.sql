-- ============================================================
-- ConstruZap — Split de pagamento (Fase 7): conexão MP por loja
-- Rode UMA VEZ no SQL Editor do Supabase.
--
-- Guarda a conexão da conta Mercado Pago de cada loja (obtida via OAuth).
-- São dados SECRETOS (tokens) — a tabela fica sem policies de RLS, então
-- NENHUM cliente/lojista a lê: só o servidor (service_role) acessa.
-- ============================================================

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
-- Sem policies de propósito: anon/authenticated não enxergam nada aqui.
-- O servidor usa a chave de serviço (service_role), que ignora o RLS.
