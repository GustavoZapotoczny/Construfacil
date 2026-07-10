-- ============================================================
-- ConstruZap — Migração de segurança
-- Rode este arquivo UMA VEZ no SQL Editor do Supabase
-- (Dashboard → SQL Editor → colar → Run).
--
-- O que ela corrige:
--   1. Cliente conseguia marcar o próprio pedido como pago (RLS aberta)
--   2. Cliente conseguia criar pedido já "pago" direto no banco
--   3. Cliente conseguia adicionar itens a um pedido já pago
--   4. Lojista ganhava lojas duplicadas (corrida no primeiro acesso)
--   5. Status 'Aguardando pagamento' documentado no CHECK da tabela
-- ============================================================

-- ---------- 5) status do fluxo de pagamento online ----------
alter table public.pedidos drop constraint if exists pedidos_status_check;
alter table public.pedidos add constraint pedidos_status_check
  check (status in (
    'Aguardando pagamento','Novo','Em preparo','Pronto',
    'A caminho','Entregue','Concluído','Cancelado'
  ));

-- ---------- 2) cliente cria pedido só como não-pago ----------
-- 'Aguardando pagamento' (Pix/cartão) ou 'Novo' apenas quando a forma
-- de pagamento é na entrega (não existe pagamento online a confirmar).
drop policy if exists pedidos_cliente_insert on public.pedidos;
create policy pedidos_cliente_insert on public.pedidos
  for insert with check (
    cliente_id = auth.uid()
    and (
      status = 'Aguardando pagamento'
      or (status = 'Novo' and forma_pagamento = 'entrega')
    )
  );

-- ---------- 1) cliente só pode CANCELAR o próprio pedido ----------
-- Nunca mudar para 'Novo'/pago — isso é papel exclusivo do servidor
-- (webhook do Mercado Pago com service_role, que ignora RLS).
drop policy if exists pedidos_cliente_update on public.pedidos;
create policy pedidos_cliente_update on public.pedidos
  for update using (
    cliente_id = auth.uid()
    and status in ('Aguardando pagamento','Novo')
  ) with check (
    cliente_id = auth.uid()
    and status = 'Cancelado'
  );

-- ---------- 3) itens só entram enquanto o pedido não está pago ----------
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

-- ---------- 4) uma loja por lojista ----------
-- Apaga lojas duplicadas VAZIAS (sem produtos e sem pedidos), mantendo a
-- melhor de cada dono (a que tem conteúdo; empate: a mais antiga)…
with ranqueadas as (
  select
    l.id,
    row_number() over (
      partition by l.dono_id
      order by
        (exists (select 1 from public.produtos p  where p.loja_id  = l.id))::int desc,
        (exists (select 1 from public.pedidos pe where pe.loja_id = l.id))::int desc,
        l.criado_em asc
    ) as pos
  from public.lojas l
)
delete from public.lojas l
using ranqueadas r
where l.id = r.id
  and r.pos > 1
  and not exists (select 1 from public.produtos p  where p.loja_id  = l.id)
  and not exists (select 1 from public.pedidos pe where pe.loja_id = l.id);

-- …e impede que o problema volte. (Se este índice falhar, ainda existem
-- dois donos com 2+ lojas COM conteúdo — resolva manualmente e rode de novo.)
create unique index if not exists lojas_uma_por_dono on public.lojas (dono_id);
