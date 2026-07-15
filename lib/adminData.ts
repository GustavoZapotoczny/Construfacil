import { supabase } from "@/lib/supabase";

/** E-mail do administrador (mesmo valor do servidor). */
export const ADMIN_EMAIL = (
  process.env.NEXT_PUBLIC_ADMIN_EMAIL || "gustavozapotoczny@gmail.com"
)
  .trim()
  .toLowerCase();

export function ehAdmin(email?: string | null): boolean {
  return !!email && email.trim().toLowerCase() === ADMIN_EMAIL;
}

async function cabecalhoAuth(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface AdminLoja {
  id: string;
  nome: string;
  logo: string;
  nota: number;
  totalPedidos: number;
  pedidosPagos: number;
  faturamento: number;
  emRetencao: number;
  liberado: number;
  porStatus: Record<string, number>;
}

export interface AdminTotais {
  lojas: number;
  faturamento: number;
  emRetencao: number;
  liberado: number;
  pedidos: number;
}

export async function carregarLojasAdmin(): Promise<{
  lojas: AdminLoja[];
  totais: AdminTotais;
}> {
  const res = await fetch("/api/admin/lojas", {
    headers: { ...(await cabecalhoAuth()) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Falha ao carregar as lojas.");
  return { lojas: data.lojas, totais: data.totais };
}

export interface AdminRepasse {
  id: string;
  nome: string;
  logo: string;
  aRepassar: number;
  qtdARepassar: number;
  jaRepassado: number;
}

export async function carregarRepasses(): Promise<AdminRepasse[]> {
  const res = await fetch("/api/admin/repasses", {
    headers: { ...(await cabecalhoAuth()) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Falha ao carregar os repasses.");
  return data.repasses;
}

export async function registrarRepasse(
  lojaId: string,
): Promise<{ repassados: number; valor: number }> {
  const res = await fetch("/api/admin/repasses", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await cabecalhoAuth()) },
    body: JSON.stringify({ lojaId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.erro || "Falha ao registrar o repasse.");
  return data;
}
