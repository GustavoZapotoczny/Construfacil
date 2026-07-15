-- ============================================================
-- ConstruZap — Escrow: confirmar recebimento + trava de status (v2)
-- Rode UMA VEZ no SQL Editor do Supabase. É idempotente (pode rodar de novo).
--
-- A trava agora é baseada na TRANSIÇÃO (de qual status para qual), não em
-- "quem age". Isso conserta a confirmação de recebimento (Entregue ->
-- Concluído) inclusive quando o dono da loja compra da própria loja, e não
-- depende de adivinhar cliente x lojista.
--
-- Regras preservadas:
--  • Pedido "Aguardando pagamento" só pode virar "Cancelado" (só o servidor/
--    webhook, com service_role, promove para pago).
--  • "Concluído" (libera o cofre) só a partir de "Entregue".
--  • Ninguém volta para "Aguardando pagamento".
-- ============================================================

-- 1) Cliente pode editar o próprio pedido; o trigger valida a transição.
drop policy if exists pedidos_cliente_update on public.pedidos;
create policy pedidos_cliente_update on public.pedidos
  for update using (cliente_id = auth.uid())
  with check (cliente_id = auth.uid());

-- 2) Trigger de transições válidas (service_role tem liberdade total).
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

  -- "Concluído" (libera o cofre) só a partir de "Entregue" (comprador confirma).
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
