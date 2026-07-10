import { MercadoPagoConfig, Payment } from "mercadopago";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Webhook do Mercado Pago. Quando um pagamento muda de estado, o MP chama
 * aqui. Confirmamos no servidor (consultando o MP) e, se aprovado, marcamos
 * o pedido correspondente como "Novo" (liberado para a loja preparar).
 * É a única forma de um pedido virar "pago" — nunca pelo cliente.
 */
export async function POST(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    const admin = getSupabaseAdmin();
    if (!accessToken || !admin) return new Response("ok", { status: 200 });

    // O MP manda o id do pagamento no corpo (data.id) ou na query (?id=).
    let paymentId: string | undefined;
    try {
      const body = await req.json();
      paymentId = body?.data?.id ? String(body.data.id) : undefined;
    } catch {
      /* corpo vazio — tenta a query abaixo */
    }
    if (!paymentId) {
      paymentId = new URL(req.url).searchParams.get("id") ?? undefined;
    }
    if (!paymentId) return new Response("ok", { status: 200 });

    const client = new MercadoPagoConfig({ accessToken });
    const r = await new Payment(client).get({ id: paymentId });

    const pedidoId = r.external_reference;
    if (r.status === "approved" && pedidoId) {
      // O valor aprovado precisa cobrir o total do pedido — sem isso, um
      // pagamento pequeno com a referência de um pedido caro o liberaria.
      const { data: pedido } = await admin
        .from("pedidos")
        .select("id, total")
        .eq("id", pedidoId)
        .maybeSingle();
      const valorPago = Number(r.transaction_amount) || 0;
      const totalPedido = Number(pedido?.total) || 0;
      if (!pedido || valorPago + 0.01 < totalPedido) {
        return new Response("ok", { status: 200 });
      }

      // Só promove se ainda estiver aguardando — idempotente.
      await admin
        .from("pedidos")
        .update({ status: "Novo" })
        .eq("id", pedidoId)
        .eq("status", "Aguardando pagamento");
    }

    return new Response("ok", { status: 200 });
  } catch {
    // Sempre 200 para o MP não ficar reenviando indefinidamente.
    return new Response("ok", { status: 200 });
  }
}
