import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { dentroDoLimite, ipDaRequisicao } from "@/lib/rateLimit";
import { calcularPedido, type ItemPedidoEntrada } from "@/lib/calculoPedido";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cria o pedido NO SERVIDOR, com os valores recalculados a partir dos preços
 * reais do banco (subtotal/frete/desconto/total e o preço de cada item). O
 * cliente não envia mais valores de dinheiro — fecha o M1 (pedido "na entrega"
 * com total forjado distorcendo o Financeiro). O status também é decidido aqui,
 * não pelo cliente.
 */
export async function POST(req: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const admin = getSupabaseAdmin();
    if (!url || !anon || !admin) {
      return Response.json({ erro: "Servidor não configurado." }, { status: 500 });
    }

    if (!dentroDoLimite(`pedido:${ipDaRequisicao(req)}`, 15)) {
      return Response.json(
        { erro: "Muitas tentativas. Aguarde um minuto e tente de novo." },
        { status: 429 },
      );
    }

    // Autentica o cliente pelo token da sessão (o cliente_id vem daqui, nunca
    // do corpo — ninguém cria pedido em nome de outra pessoa).
    const bearer = (req.headers.get("authorization") ?? "")
      .replace(/^Bearer\s+/i, "")
      .trim();
    if (!bearer) {
      return Response.json(
        { erro: "Faça login para finalizar o pedido." },
        { status: 401 },
      );
    }
    const sbUser = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: u } = await sbUser.auth.getUser(bearer);
    const clienteId = u.user?.id;
    if (!clienteId) {
      return Response.json({ erro: "Sessão inválida." }, { status: 401 });
    }

    const body = await req.json();
    const lojaId: string = body?.lojaId;
    const cupomCodigo: string | undefined = body?.cupomCodigo || undefined;
    const formaPagamento: string = String(body?.formaPagamento ?? "");
    const enderecoId: string | undefined = body?.enderecoId || undefined;
    const enderecoResumo: string = String(body?.enderecoResumo ?? "").slice(0, 300);
    const clienteNome: string | null = body?.clienteNome
      ? String(body.clienteNome).slice(0, 120)
      : null;

    if (!Array.isArray(body?.itens) || body.itens.length === 0 || !lojaId) {
      return Response.json({ erro: "Itens do pedido ausentes." }, { status: 400 });
    }
    const itens: ItemPedidoEntrada[] = body.itens
      .slice(0, 200)
      .map((i: { produtoId?: unknown; quantidade?: unknown }) => ({
        produtoId: String(i?.produtoId ?? ""),
        quantidade: Number(i?.quantidade) || 0,
      }));

    // Valores autoritativos (a partir dos preços reais). Lança em caso de item
    // inválido/indisponível/de outra loja.
    const calc = await calcularPedido(sbUser, itens, lojaId, cupomCodigo);
    if (!(calc.total > 0)) {
      return Response.json({ erro: "Valor do pedido inválido." }, { status: 400 });
    }

    // O endereço, se informado, precisa ser do próprio cliente.
    let enderecoIdValido: string | null = null;
    if (enderecoId) {
      const { data: end } = await admin
        .from("enderecos")
        .select("id")
        .eq("id", enderecoId)
        .eq("usuario_id", clienteId)
        .maybeSingle();
      enderecoIdValido = (end?.id as string | undefined) ?? null;
    }

    // O SERVIDOR decide o status: 'entrega' já nasce 'Novo' (não há pagamento
    // online a confirmar); qualquer outra forma nasce 'Aguardando pagamento' e
    // só o webhook do Mercado Pago promove para 'Novo'.
    const status = formaPagamento === "entrega" ? "Novo" : "Aguardando pagamento";

    const { data: ped, error } = await admin
      .from("pedidos")
      .insert({
        cliente_id: clienteId,
        cliente_nome: clienteNome,
        loja_id: lojaId,
        endereco_id: enderecoIdValido,
        endereco_resumo: enderecoResumo,
        status,
        subtotal: calc.subtotal,
        frete: calc.frete,
        desconto: calc.desconto,
        total: calc.total,
        forma_pagamento: formaPagamento,
        cupom_codigo: cupomCodigo ?? null,
      })
      .select("id")
      .single();
    if (error || !ped) {
      console.error("[pedido] falha ao inserir pedido:", error?.message);
      return Response.json({ erro: "Não foi possível criar o pedido." }, { status: 500 });
    }

    const linhas = calc.linhas.map((l) => ({
      pedido_id: ped.id,
      produto_id: l.produtoId,
      nome: l.nome,
      quantidade: l.quantidade,
      preco_unitario: l.precoUnitario,
    }));
    const { error: errItens } = await admin.from("itens_pedido").insert(linhas);
    if (errItens) {
      // Não deixa um pedido órfão (sem itens) no banco.
      await admin.from("pedidos").delete().eq("id", ped.id);
      console.error("[pedido] falha ao inserir itens:", errItens.message);
      return Response.json(
        { erro: "Não foi possível criar os itens do pedido." },
        { status: 500 },
      );
    }

    return Response.json({
      id: ped.id,
      status,
      subtotal: calc.subtotal,
      frete: calc.frete,
      desconto: calc.desconto,
      total: calc.total,
    });
  } catch (e) {
    // Mensagens de validação do cálculo (ex.: "Produto indisponível.") são
    // seguras de mostrar; detalhe interno fica no log.
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[pedido] erro:", msg);
    return Response.json({ erro: msg }, { status: 400 });
  }
}
