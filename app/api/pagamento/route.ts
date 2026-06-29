import { MercadoPagoConfig, Payment } from "mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cria um pagamento no Mercado Pago a partir dos dados do Payment Brick.
 * - Cartão: o Brick envia um `token` (dados do cartão já protegidos pelo MP).
 * - Pix: retorna o QR Code + copia-e-cola para exibir dentro do app.
 * O dinheiro entra na conta da plataforma (modelo "cofre"): só é repassado
 * às lojas depois que o comprador confirmar o recebimento.
 */
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
    const descricao: string = body?.descricao ?? "Pedido ConstruZap";
    const referencia: string | undefined = body?.referencia; // id do pedido, se houver

    if (!formData || typeof formData !== "object") {
      return Response.json({ erro: "Dados de pagamento ausentes." }, { status: 400 });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);

    // Chave de idempotência simples (evita cobrança duplicada em reenvios).
    const idem = `${referencia ?? "pedido"}-${formData?.token ?? formData?.payment_method_id ?? "pix"}`;

    const resultado = await payment.create({
      body: {
        ...formData,
        description: descricao,
        ...(referencia ? { external_reference: referencia } : {}),
      },
      requestOptions: { idempotencyKey: idem },
    });

    const pix = resultado.point_of_interaction?.transaction_data;

    return Response.json({
      id: resultado.id,
      status: resultado.status, // approved | pending | in_process | rejected
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
