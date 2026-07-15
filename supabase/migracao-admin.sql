-- ============================================================
-- ConstruZap — Painel do administrador: controle de repasses
-- Rode UMA VEZ no SQL Editor do Supabase.
--
-- Marca em cada pedido se o valor já foi repassado ao lojista.
-- "A repassar" = pedidos concluídos (cliente confirmou o recebimento)
-- que ainda não foram repassados.
-- ============================================================

alter table public.pedidos
  add column if not exists repassado boolean not null default false;

alter table public.pedidos
  add column if not exists repassado_em timestamptz;

-- Consulta rápida dos repasses pendentes por loja
create index if not exists idx_pedidos_repasse
  on public.pedidos (loja_id, status, repassado);
