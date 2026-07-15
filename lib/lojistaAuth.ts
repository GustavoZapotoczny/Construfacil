import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/**
 * Valida que a requisição vem de um LOJISTA logado e descobre a loja dele.
 * Retorna o cliente service_role + a loja, ou uma Response de erro pronta.
 */
export async function autorizarLojista(
  req: Request,
): Promise<
  | { admin: SupabaseClient; userId: string; lojaId: string }
  | { erro: Response }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const admin = getSupabaseAdmin();
  if (!url || !anon || !admin) {
    return {
      erro: Response.json({ erro: "Servidor não configurado." }, { status: 500 }),
    };
  }

  const token = (req.headers.get("authorization") ?? "")
    .replace(/^Bearer\s+/i, "")
    .trim();
  if (!token) {
    return { erro: Response.json({ erro: "Faça login." }, { status: 401 }) };
  }

  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb.auth.getUser(token);
  const userId = data.user?.id;
  if (error || !userId) {
    return { erro: Response.json({ erro: "Sessão inválida." }, { status: 401 }) };
  }

  const { data: loja } = await admin
    .from("lojas")
    .select("id")
    .eq("dono_id", userId)
    .order("criado_em")
    .limit(1)
    .maybeSingle();
  if (!loja) {
    return { erro: Response.json({ erro: "Loja não encontrada." }, { status: 404 }) };
  }

  return { admin, userId, lojaId: loja.id as string };
}
