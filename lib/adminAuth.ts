import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

/** E-mail do administrador da plataforma (configurável por env). */
export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "gustavozapotoczny@gmail.com"
)
  .trim()
  .toLowerCase();

/**
 * Valida que a requisição vem do ADMINISTRADOR da plataforma (pelo token da
 * sessão). Retorna o cliente service_role (que enxerga todas as lojas/pedidos,
 * ignorando o RLS) ou uma Response de erro pronta.
 */
export async function autorizarAdmin(
  req: Request,
): Promise<{ admin: SupabaseClient } | { erro: Response }> {
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
  const email = data.user?.email?.toLowerCase();
  if (error || !email) {
    return { erro: Response.json({ erro: "Sessão inválida." }, { status: 401 }) };
  }
  if (email !== ADMIN_EMAIL) {
    return {
      erro: Response.json(
        { erro: "Acesso restrito ao administrador." },
        { status: 403 },
      ),
    };
  }
  return { admin };
}
