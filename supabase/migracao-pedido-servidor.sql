-- ============================================================
-- ConstruZap — Criação de pedido exclusiva do servidor (fecha M1)
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente.
--
-- ⚠️ RODAR SOMENTE DEPOIS que a versão com a rota /api/pedido estiver no ar e
--    verificada (a criação de pedido passa a depender dela). Antes disso, o
--    cliente ainda insere direto e remover as policies quebraria o checkout.
--
-- O que muda:
--   O cliente NÃO insere mais pedidos/itens direto no banco. Toda criação passa
--   por /api/pedido (service_role), que recalcula subtotal/frete/desconto/total
--   e o preço de cada item a partir dos PREÇOS REAIS. Assim o cliente não
--   consegue mais gravar um total/itens forjados (que distorciam o Financeiro
--   em pedidos "na entrega").
--
--   Leitura e updates do cliente (cancelar, confirmar recebimento) continuam
--   iguais — só o INSERT direto é removido.
-- ============================================================

drop policy if exists pedidos_cliente_insert on public.pedidos;
drop policy if exists itens_insert on public.itens_pedido;

-- (Opcional de rollback, se um dia quiser voltar ao insert pelo cliente:
--  recrie as policies do supabase/schema.sql — pedidos_cliente_insert e
--  itens_insert. Mas aí o M1 reabre.)
