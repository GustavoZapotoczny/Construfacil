import { autorizarLojista } from "@/lib/lojistaAuth";
import { MP_CLIENT_ID, assinarState, redirectUri } from "@/lib/mpConexao";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Início da conexão: devolve a URL de autorização do Mercado Pago para o
 * lojista logado. O app abre essa URL; o MP redireciona de volta ao callback.
 */
export async function GET(req: Request) {
  const auth = await autorizarLojista(req);
  if ("erro" in auth) return auth.erro;

  if (!process.env.MP_CLIENT_SECRET) {
    return Response.json(
      { erro: "Conexão com o Mercado Pago ainda não foi configurada no servidor." },
      { status: 503 },
    );
  }

  const origin = new URL(req.url).origin;
  const state = assinarState(auth.lojaId);
  const url =
    `https://auth.mercadopago.com.br/authorization?client_id=${MP_CLIENT_ID}` +
    `&response_type=code&platform_id=mp` +
    `&state=${encodeURIComponent(state)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri(origin))}`;

  return Response.json({ url });
}
