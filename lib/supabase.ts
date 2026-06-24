import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Cliente Supabase. A partir da Fase 3 cuida da autenticação;
// na Fase 4 passa a servir também os dados (lojas, produtos, pedidos).
// As variáveis ficam em .env.local — nunca commitar chaves.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** true quando as variáveis de ambiente do Supabase estão presentes. */
export const supabaseConfigurado = Boolean(url && anonKey);

export const supabase: SupabaseClient | null = supabaseConfigurado
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
      },
    })
  : null;
