import { createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MercadoPagoConfig, Payment } from "mercadopago";
import type { PaymentResponse } from "mercadopago/dist/clients/payment/commonTypes";

/** Client id da aplicação Mercado Pago (= id do app). */
export const MP_CLIENT_ID = process.env.MP_CLIENT_ID || "6456779893485848";

/** Comissão da plataforma (%), configurável por env. */
export const COMISSAO_PERCENT = Number(process.env.PLATFORM_FEE_PERCENT || "5");

/** Segredo para assinar o `state` do OAuth (nunca vai ao cliente). */
function segredoState(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.MP_ACCESS_TOKEN ||
    "construzap-dev"
  );
}

/** Assina o `state` do OAuth com o id da loja (protege contra troca de loja). */
export function assinarState(lojaId: string): string {
  const payload = `${lojaId}.${Date.now()}`;
  const sig = createHmac("sha256", segredoState())
    .update(payload)
    .digest("hex")
    .slice(0, 32);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

/** Verifica o `state` e devolve o id da loja (ou null se inválido/expirado). */
export function verificarState(state: string): string | null {
  try {
    const raw = Buffer.from(state, "base64url").toString();
    const [lojaId, ts, sig] = raw.split(".");
    if (!lojaId || !ts || !sig) return null;
    const esperado = createHmac("sha256", segredoState())
      .update(`${lojaId}.${ts}`)
      .digest("hex")
      .slice(0, 32);
    if (esperado !== sig) return null;
    if (Date.now() - Number(ts) > 15 * 60 * 1000) return null; // expira em 15 min
    return lojaId;
  } catch {
    return null;
  }
}

/** URL de retorno registrada no app do Mercado Pago. */
export function redirectUri(origin: string): string {
  return `${origin}/api/lojista/mp/callback`;
}

/**
 * Token de acesso da conta Mercado Pago conectada da loja (ou null se a loja
 * ainda não conectou). Usado para cobrar na conta dela (split de pagamento).
 */
export async function tokenDaLoja(
  admin: SupabaseClient,
  lojaId: string,
): Promise<string | null> {
  const { data } = await admin
    .from("mp_conexoes")
    .select("access_token")
    .eq("loja_id", lojaId)
    .maybeSingle();
  return (data?.access_token as string | undefined) ?? null;
}

/**
 * Busca um pagamento tentando cada conta informada. A cobrança pode estar na
 * conta da loja (split) OU na da plataforma (quando o split caiu no fallback),
 * e às vezes uma conta vê "approved" enquanto a outra ainda mostra "pending" —
 * então checamos TODAS e preferimos o resultado "approved" (definitivo).
 */
export async function buscarPagamento(
  id: string,
  tokens: (string | null | undefined)[],
): Promise<PaymentResponse | null> {
  let melhor: PaymentResponse | null = null;
  for (const token of tokens) {
    if (!token) continue;
    try {
      const client = new MercadoPagoConfig({ accessToken: token });
      const r = await new Payment(client).get({ id });
      if (!r) continue;
      if (r.status === "approved") return r; // aprovado é definitivo
      if (!melhor) melhor = r; // guarda o 1º achado (ex.: pending)
    } catch {
      /* não está nesta conta — tenta a próxima */
    }
  }
  return melhor;
}
