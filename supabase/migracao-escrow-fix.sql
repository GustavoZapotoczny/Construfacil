-- ============================================================
-- ConstruZap — Correção do escrow (confirmar recebimento) + trava de status
-- Rode UMA VEZ no SQL Editor do Supabase (depois da migracao-seguranca.sql).
--
-- Por quê:
--   A migração de segurança anterior restringiu o UPDATE do cliente só a
--   'Cancelado', o que QUEBROU o botão "Confirmar recebimento"
--   (transição 'Entregue' -> 'Concluído', que libera o dinheiro do cofre).
--
--   Além disso, a regra do lojista não travava o status de destino, então o
--   próprio lojista conseguia marcar 'Concluído' e liberar o dinheiro sem o
--   comprador confirmar — o que anula o escrow.
--
-- Como resolve:
--   A RLS volta a deixar o cliente editar o PRÓPRIO pedido, e um TRIGGER passa
--   a validar QUAIS transições cada lado pode fazer. RLS controla "de quem é o
--   pedido"; o trigger controla "de qual status para qual status".
-- ============================================================

-- 1) Cliente pode editar o próprio pedido (o trigger valida a transição)
drop policy if exists pedidos_cliente_update on public.pedidos;
create policy pedidos_cliente_update on public.pedidos
  for update using (cliente_id = auth.uid())
  with check (cliente_id = auth.uid());

-- 2) Trigger: valida as transições de status conforme o ator
create or replace function public.pedido_transicao_valida()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Servidor (webhook/admin com service_role) tem liberdade total.
  if auth.role() = 'service_role' then
    return new;
  end if;

  -- Sem mudança de status: nada a validar.
  if new.status is not distinct from old.status then
    return new;
  end if;

  -- CLIENTE dono do pedido: só cancelar (antes de pago) ou confirmar recebimento.
  if new.cliente_id = auth.uid() then
    if (old.status in ('Aguardando pagamento','Novo') and new.status = 'Cancelado')
       or (old.status = 'Entregue' and new.status = 'Concluído') then
      return new;
    end if;
    raise exception
      'Transicao de status nao permitida para o cliente (% -> %)',
      old.status, new.status;
  end if;

  -- LOJISTA (a RLS já garantiu que é dono da loja): pode tocar o pedido no
  -- fluxo de entrega, mas NUNCA marcar 'Concluído' (libera o cofre — é
  -- exclusivo do comprador) nem voltar para 'Aguardando pagamento'.
  if new.status in ('Concluído','Aguardando pagamento') then
    raise exception
      'Lojista nao pode definir o status % (reservado ao comprador/servidor)',
      new.status;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_pedido_transicao on public.pedidos;
create trigger trg_pedido_transicao
  before update on public.pedidos
  for each row execute function public.pedido_transicao_valida();
