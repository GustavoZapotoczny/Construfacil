-- ============================================================
-- ConstruZap — Split de pagamento (Fase 7, parte 2)
-- Rode UMA VEZ no SQL Editor do Supabase.
--
-- Guarda no pedido o id do pagamento no Mercado Pago. Assim o webhook e a
-- consulta de status sabem em qual conta (loja) buscar o pagamento —
-- necessário quando a cobrança é feita na conta da loja (split).
-- ============================================================

alter table public.pedidos
  add column if not exists mp_payment_id text;

create index if not exists idx_pedidos_mp_payment
  on public.pedidos (mp_payment_id);
