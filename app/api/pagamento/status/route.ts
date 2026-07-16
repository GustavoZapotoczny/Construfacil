import { dentroDoLimite, ipDaRequisicao } from "@/lib/rateLimit";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { tokenDaLoja, buscarPagamento } from "@/lib/mpConexao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Consulta o status de um pagamento (usado pelo app para acompanhar o Pix). */
export async function GET(req: Request) {
  try {
    const platformToken = process.env.MP_ACCESS_TOKEN;
    if (!platformToken) {
      return Response.json({ erro: "MP_ACCESS_TOKEN não configurado." }, { status: 500 });
    }

    // O app consulta a cada 4s (15/min); 40/min dá folga sem permitir flood.
    if (!dentroDoLimite(`status:${ipDaRequisicao(req)}`, 40)) {
      return Response.json({ erro: "Muitas consultas." }, { status: 429 });
    }

    const params = new URL(req.url).searchParams;
    const id = params.get("id");
    const lojaId = params.get("loja"); // p/ pagamentos com split (conta da loja)
    if (!id) return Response.json({ erro: "id ausente." }, { status: 400 });

    // A cobrança pode estar na conta da loja (split) OU na da plataforma
    // (quando o split não pôde ser usado) — procuramos nas duas.
    let sellerToken: string | null = null;
    if (lojaId) {
      const admin = getSupabaseAdmin();
      if (admin) sellerToken = await tokenDaLoja(admin, lojaId);
    }

    const r = await buscarPagamento(id, [sellerToken, platformToken]);
    if (!r) {
      return Response.json({ erro: "Pagamento não encontrado." }, { status: 404 });
    }

    return Response.json({ id: r.id, status: r.status, status_detail: r.status_detail });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    return Response.json({ erro: msg }, { status: 500 });
  }
}
