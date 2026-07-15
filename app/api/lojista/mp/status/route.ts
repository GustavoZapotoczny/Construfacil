import { autorizarLojista } from "@/lib/lojistaAuth";
import { COMISSAO_PERCENT } from "@/lib/mpConexao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Diz se a loja do lojista logado já conectou a conta Mercado Pago. */
export async function GET(req: Request) {
  const auth = await autorizarLojista(req);
  if ("erro" in auth) return auth.erro;

  const { data } = await auth.admin
    .from("mp_conexoes")
    .select("mp_user_id, conectado_em")
    .eq("loja_id", auth.lojaId)
    .maybeSingle();

  return Response.json({
    conectado: !!data,
    mpUserId: data?.mp_user_id ?? null,
    configurado: !!process.env.MP_CLIENT_SECRET,
    comissao: COMISSAO_PERCENT,
  });
}
