-- ============================================================
-- ConstruZap — Migração de segurança 2 (pentest 2026-07-28)
-- Rode UMA VEZ no SQL Editor do Supabase. Idempotente (pode repetir).
--
-- Fecha os furos de INTEGRIDADE FINANCEIRA achados no pentest white-box:
--
--   H1) Lojista (ou cliente) conseguia ALTERAR total/subtotal/frete/desconto/
--       repassado dos próprios pedidos via RLS — o trigger antigo só validava
--       'status'. Com isso o lojista inflava o 'total' de pedidos 'Concluído'
--       e a rota /api/admin/repasses pagava repasse a mais.
--
--   H2) Lojista conseguia LIBERAR o próprio escrow: o trigger antigo permitia
--       Entregue->Concluído para qualquer ator com update na linha. Agora só o
--       COMPRADOR (cliente_id = quem faz a ação) pode concluir/confirmar o
--       recebimento — continua funcionando quando dono=loja (conta única),
--       porque aí cliente_id já é o próprio dono.
--
-- As colunas financeiras/estruturais passam a ser EXCLUSIVAS do servidor
-- (service_role: webhook do MP, /api/pagamento, painel admin).
-- ============================================================

create or replace function public.pedido_transicao_valida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- O servidor (service_role) tem liberdade total: webhook, pagamento, admin.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- H1: campos de dinheiro e de vínculo são IMUTÁVEIS pelo usuário comum,
  -- independentemente de haver mudança de status. Só o servidor os altera.
  if new.total        is distinct from old.total
     or new.subtotal  is distinct from old.subtotal
     or new.frete     is distinct from old.frete
     or new.desconto  is distinct from old.desconto
     or new.repassado is distinct from old.repassado
     or new.repassado_em  is distinct from old.repassado_em
     or new.mp_payment_id is distinct from old.mp_payment_id
     or new.loja_id       is distinct from old.loja_id
     or new.cliente_id    is distinct from old.cliente_id then
    raise exception
      'Campos financeiros/estruturais do pedido so podem ser alterados pelo servidor';
  end if;

  -- Sem mudança de status: nada mais a validar.
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- Pedido ainda não pago só pode ser cancelado (virar pago é só via servidor).
  if old.status = 'Aguardando pagamento' and new.status <> 'Cancelado' then
    raise exception
      'Pedido aguardando pagamento so pode ser cancelado (% -> %)',
      old.status, new.status;
  end if;

  -- Nunca voltar para "Aguardando pagamento".
  if new.status = 'Aguardando pagamento' then
    raise exception 'Nao e possivel voltar para Aguardando pagamento';
  end if;

  -- "Concluído" (libera o cofre) só a partir de "Entregue"…
  if new.status = 'Concluído' and old.status <> 'Entregue' then
    raise exception
      'So e possivel concluir (liberar) um pedido que foi entregue (% -> %)',
      old.status, new.status;
  end if;

  -- H2: …e SÓ o comprador confirma o recebimento (não o lojista).
  if new.status = 'Concluído' and old.cliente_id <> auth.uid() then
    raise exception 'Apenas o comprador confirma o recebimento do pedido';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_pedido_transicao on public.pedidos;
create trigger trg_pedido_transicao
  before update on public.pedidos
  for each row execute function public.pedido_transicao_valida();
