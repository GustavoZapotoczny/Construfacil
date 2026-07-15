import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { MP_CLIENT_ID, verificarState, redirectUri } from "@/lib/mpConexao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Retorno do Mercado Pago após o lojista autorizar. Troca o `code` pelos
 * tokens da conta dele e guarda em `mp_conexoes` (só o servidor acessa).
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const voltar = (ok: boolean) =>
    Response.redirect(
      `${url.origin}/lojista/perfil/pagamento?mp=${ok ? "ok" : "erro"}`,
      302,
    );

  const lojaId = state ? verificarState(state) : null;
  const admin = getSupabaseAdmin();
  const secret = process.env.MP_CLIENT_SECRET;
  if (!code || !lojaId || !admin || !secret) return voltar(false);

  try {
    const r = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: MP_CLIENT_ID,
        client_secret: secret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri(url.origin),
      }),
    });
    const d = await r.json();
    if (!r.ok || !d?.access_token) return voltar(false);

    await admin.from("mp_conexoes").upsert({
      loja_id: lojaId,
      mp_user_id: d.user_id != null ? String(d.user_id) : null,
      access_token: d.access_token,
      refresh_token: d.refresh_token ?? null,
      public_key: d.public_key ?? null,
      atualizado_em: new Date().toISOString(),
    });

    return voltar(true);
  } catch {
    return voltar(false);
  }
}
