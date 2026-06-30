import { MercadoPagoConfig, Payment } from "mercadopago";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MINIMO_FRETE_GRATIS = 150;

interface ItemPedido {
  produtoId: string;
  quantidade: number;
}

/**
 * Calcula o valor a cobrar NO SERVIDOR, a partir dos preços reais do banco.
 * Nunca confia no valor enviado pelo cliente (evita adulteração do preço).
 */
async function calcularValorAutoritativo(
  itens: ItemPedido[],
  lojaId: string,
  cupomCodigo?: string,
): Promise<number> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Supabase não configurado no servidor.");
  const sb = createClient(url, anon);

  const ids = itens.map((i) => i.produtoId);
  const { data: produtos, error } = await sb
    .from("produtos")
    .select("id, preco, desconto, loja_id, disponivel")
    .in("id", ids);
  if (error) throw new Error("Falha ao consultar produtos.");

  let subtotal = 0;
  for (const item of itens) {
    const p = produtos?.find((x) => x.id === item.produtoId);
    if (!p || p.disponivel === false) throw new Error("Produto indisponível.");
    if (p.loja_id !== lojaId) throw new Error("Itens de lojas diferentes.");
    const qtd = Math.max(1, Math.floor(Number(item.quantidade) || 0));
    const desconto = Number(p.desconto) || 0;
    const preco = Number(p.preco) * (1 - desconto / 100);
    subtotal += preco * qtd;
  }

  const { data: loja } = await sb
    .from("lojas")
    .select("taxa_entrega")
    .eq("id", lojaId)
    .maybeSingle();
  let frete = subtotal >= MINIMO_FRETE_GRATIS ? 0 : Number(loja?.taxa_entrega) || 0;

  let descontoCupom = 0;
  if (cupomCodigo) {
    const { data: cupom } = await sb
      .from("cupons")
      .select("tipo, valor, ativo")
      .eq("loja_id", lojaId)
      .eq("codigo", String(cupomCodigo).trim().toUpperCase())
      .eq("ativo", true)
      .maybeSingle();
    if (cupom) {
      if (cupom.tipo === "frete") frete = 0;
      else if (cupom.tipo === "percentual")
        descontoCupom = subtotal * (Number(cupom.valor) / 100);
      else if (cupom.tipo === "fixo")
        descontoCupom = Math.min(Number(cupom.valor), subtotal);
    }
  }

  const total = Math.max(0, subtotal - descontoCupom) + frete;
  return Math.round(total * 100) / 100;
}

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return Response.json(
        { erro: "MP_ACCESS_TOKEN não configurado no servidor." },
        { status: 500 },
      );
    }

    const body = await req.json();
    const formData = body?.formData;
    const itens: ItemPedido[] = body?.itens;
    const lojaId: string = body?.lojaId;
    const cupomCodigo: string | undefined = body?.cupomCodigo;
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

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    const resultado = await payment.create({
      body: {
        ...formData,
        transaction_amount: valor,
        description: descricao,
      },
      requestOptions: { idempotencyKey: randomUUID() },
    });

    const pix = resultado.point_of_interaction?.transaction_data;

    return Response.json({
      id: resultado.id,
      status: resultado.status,
      status_detail: resultado.status_detail,
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
    return Response.json({ erro: `Falha no pagamento: ${msg}` }, { status: 500 });
  }
}
