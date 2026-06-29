import { MercadoPagoConfig, Payment } from "mercadopago";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Consulta o status de um pagamento (usado pelo app para acompanhar o Pix). */
export async function GET(req: Request) {
  try {
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return Response.json({ erro: "MP_ACCESS_TOKEN não configurado." }, { status: 500 });
    }

    const id = new URL(req.url).searchParams.get("id");
    if (!id) return Response.json({ erro: "id ausente." }, { status: 400 });

    const client = new MercadoPagoConfig({ accessToken });
    const payment = new Payment(client);
    const r = await payment.get({ id });

    return Response.json({ id: r.id, status: r.status, status_detail: r.status_detail });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return Response.json({ erro: msg }, { status: 500 });
  }
}
