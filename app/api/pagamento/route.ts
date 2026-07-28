import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { randomUUID, createHash } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { dentroDoLimite, ipDaRequisicao } from "@/lib/rateLimit";
import { COMISSAO_PERCENT, tokenDaLoja } from "@/lib/mpConexao";
import { calcularPedido, type ItemPedidoEntrada } from "@/lib/calculoPedido";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Valor a cobrar NO SERVIDOR, a partir dos preços reais do banco (nunca do
 * cliente). Usa o MESMO cálculo de /api/pedido, então o total cobrado é
 * idêntico ao total gravado no pedido.
 */
async function calcularValorAutoritativo(
  itens: ItemPedidoEntrada[],
  lojaId: string,
  cupomCodigo?: string,
): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase não configurado no servidor.");
  const sb = createClient(url, anon);
  const calc = await calcularPedido(sb, itens, lojaId, cupomCodigo);
  return calc.total;
}

/** Extrai uma mensagem legível de um erro do SDK do Mercado Pago. */
function descreverErroMP(e: unknown): string {
  const o = (e ?? {}) as { message?: string; cause?: unknown };
  const partes: string[] = [];
  if (o.message) partes.push(o.message);
  if (o.cause) {
    try {
      partes.push(JSON.stringify(o.cause));
    } catch {
      /* ignora */
    }
  }
  if (!partes.length) {
    try {
      partes.push(JSON.stringify(e));
    } catch {
      partes.push(String(e));
    }
  }
  return partes.join(" | ").slice(0, 600);
}

export async function POST(req: Request) {
  let usouSplit = false;
  let splitErroDebug: string | null = null;
  try {
    const platformToken = process.env.MP_ACCESS_TOKEN;
    if (!platformToken) {
      return Response.json(
        { erro: "MP_ACCESS_TOKEN não configurado no servidor." },
        { status: 500 },
      );
    }

    if (!dentroDoLimite(`pagamento:${ipDaRequisicao(req)}`, 10)) {
      return Response.json(
        { erro: "Muitas tentativas. Aguarde um minuto e tente de novo." },
        { status: 429 },
      );
    }

    const body = await req.json();
    const formData = body?.formData;
    const itens: ItemPedidoEntrada[] = body?.itens;
    const lojaId: string = body?.lojaId;
    const cupomCodigo: string | undefined = body?.cupomCodigo;
    const referencia: string | undefined = body?.referencia; // id do pedido
    const descricao: string = body?.descricao ?? "Pedido ConstruZap";

    if (!formData || typeof formData !== "object") {
      return Response.json({ erro: "Dados de pagamento ausentes." }, { status: 400 });
    }
    if (!Array.isArray(itens) || itens.length === 0 || !lojaId) {
      return Response.json({ erro: "Itens do pedido ausentes." }, { status: 400 });
    }

    // Valor calculado no servidor — sobrescreve qualquer valor vindo do cliente.
    const valor = await calcularValorAutoritativo(itens, lojaId, cupomCodigo);
    if (!(valor > 0)) {
      return Response.json({ erro: "Valor do pedido inválido." }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Se veio uma referência de pedido, ela precisa apontar para um pedido
    // real, ainda não pago, da mesma loja e com o MESMO total. Sem isso,
    // alguém poderia pagar R$ 0,01 e "quitar" um pedido caro de outra compra.
    if (referencia && admin) {
      const { data: pedido } = await admin
        .from("pedidos")
        .select("id, loja_id, status, total")
        .eq("id", referencia)
        .maybeSingle();
      if (
        !pedido ||
        pedido.status !== "Aguardando pagamento" ||
        pedido.loja_id !== lojaId ||
        Math.abs(Number(pedido.total) - valor) > 0.01
      ) {
        return Response.json(
          { erro: "Pedido não confere com o pagamento." },
          { status: 400 },
        );
      }
    }

    // SPLIT: se a loja conectou a conta Mercado Pago dela, a cobrança é feita
    // NA CONTA DELA e a plataforma retém a comissão (application_fee).
    const sellerToken = admin ? await tokenDaLoja(admin, lojaId) : null;
    const origin = new URL(req.url).origin;

    // Idempotência determinística: um duplo-clique (mesmo pedido, mesmo método,
    // mesma janela de ~10 min) reaproveita a MESMA cobrança em vez de criar
    // duas. O 'token' do cartão é de uso único, então uma nova tentativa real
    // (novo cartão) difere naturalmente; o Pix fica estável por pedido.
    const idemBase = referencia
      ? `${referencia}|${formData?.token ?? formData?.payment_method_id ?? "pix"}|${Math.floor(Date.now() / 600_000)}`
      : randomUUID();
    const idempotencyKey = createHash("sha256").update(String(idemBase)).digest("hex");

    const criarPagamento = (token: string, comissao: number) => {
      const client = new MercadoPagoConfig({ accessToken: token });
      return new Payment(client).create({
        body: {
          ...formData,
          transaction_amount: valor,
          description: descricao,
          ...(referencia ? { external_reference: referencia } : {}),
          ...(comissao > 0 ? { application_fee: comissao } : {}),
          notification_url: `${origin}/api/webhook/mercadopago`,
        },
        requestOptions: { idempotencyKey },
      });
    };

    let resultado: Awaited<ReturnType<typeof criarPagamento>> | null = null;

    if (sellerToken) {
      const comissao = Math.round(valor * (COMISSAO_PERCENT / 100) * 100) / 100;
      try {
        resultado = await criarPagamento(sellerToken, comissao);
        usouSplit = true;
      } catch (e) {
        // Rede de segurança: se o split falhar (ex.: conta única não pode
        // cobrar comissão de si mesma), cobra na conta da plataforma.
        splitErroDebug = descreverErroMP(e);
        resultado = null;
      }
    }
    if (!resultado) {
      try {
        resultado = await criarPagamento(platformToken, 0);
      } catch (e) {
        // L5: detalhe do MP fica só no log do servidor — cliente vê msg genérica.
        console.error(
          "[pagamento] falha ao criar no MP:",
          descreverErroMP(e),
          splitErroDebug ? `| split antes: ${splitErroDebug}` : "",
        );
        return Response.json(
          {
            erro: "Não foi possível processar o pagamento agora. Tente novamente em instantes.",
          },
          { status: 502 },
        );
      }
    }
    if (splitErroDebug) {
      // Diagnóstico do fallback do split: só no servidor (não vai ao cliente).
      console.warn("[pagamento] split caiu no fallback:", splitErroDebug);
    }

    // Guarda o id do pagamento no pedido — o webhook e a consulta de status
    // usam isso para achar em qual conta (loja) buscar o pagamento.
    if (referencia && admin && resultado.id) {
      await admin
        .from("pedidos")
        .update({ mp_payment_id: String(resultado.id) })
        .eq("id", referencia);
    }

    // Cartão aprovado na hora: promove o pedido já (o Pix vem pelo webhook).
    if (resultado.status === "approved" && referencia && admin) {
      await admin
        .from("pedidos")
        .update({ status: "Novo" })
        .eq("id", referencia)
        .eq("status", "Aguardando pagamento");
    }

    const pix = resultado.point_of_interaction?.transaction_data;

    return Response.json({
      id: resultado.id,
      status: resultado.status,
      status_detail: resultado.status_detail,
      split: usouSplit, // true = cobrado na conta da loja com comissão
      pix: pix
        ? {
            qrCode: pix.qr_code,
            qrCodeBase64: pix.qr_code_base64,
            ticketUrl: pix.ticket_url,
          }
        : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[pagamento] erro:", msg);
    return Response.json({ erro: `Falha no pagamento: ${msg}` }, { status: 500 });
  }
}
