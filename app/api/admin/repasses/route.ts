import { autorizarAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LojaRow {
  id: string;
  nome: string;
  logo_url: string | null;
}
interface PedRow {
  loja_id: string;
  status: string;
  total: number | string | null;
  repassado: boolean | null;
}

const arred = (v: number) => Math.round(v * 100) / 100;

/** Situação dos repasses por loja (o que já foi liberado pelo cliente). */
export async function GET(req: Request) {
  const auth = await autorizarAdmin(req);
  if ("erro" in auth) return auth.erro;
  const { admin } = auth;

  const { data: lojasData, error: e1 } = await admin
    .from("lojas")
    .select("id, nome, logo_url");
  if (e1) return Response.json({ erro: "Falha ao ler lojas." }, { status: 500 });

  const { data: pedidosData, error: e2 } = await admin
    .from("pedidos")
    .select("loja_id, status, total, repassado")
    .eq("status", "Concluído");
  if (e2) {
    return Response.json(
      { erro: "Falha ao ler pedidos. A migração 'migracao-admin.sql' já foi aplicada?" },
      { status: 500 },
    );
  }

  const lojas = (lojasData ?? []) as LojaRow[];
  const pedidos = (pedidosData ?? []) as PedRow[];

  const lista = lojas
    .map((l) => {
      const concluidos = pedidos.filter((p) => p.loja_id === l.id);
      const pendentes = concluidos.filter((p) => !p.repassado);
      const pagos = concluidos.filter((p) => p.repassado);
      const sum = (arr: PedRow[]) =>
        arred(arr.reduce((s, p) => s + (Number(p.total) || 0), 0));
      return {
        id: l.id,
        nome: l.nome,
        logo: l.logo_url || "🏗️",
        aRepassar: sum(pendentes),
        qtdARepassar: pendentes.length,
        jaRepassado: sum(pagos),
      };
    })
    .sort((a, b) => b.aRepassar - a.aRepassar);

  return Response.json({ repasses: lista });
}

/** Marca como repassados todos os pedidos concluídos e pendentes de uma loja. */
export async function POST(req: Request) {
  const auth = await autorizarAdmin(req);
  if ("erro" in auth) return auth.erro;
  const { admin } = auth;

  const body = await req.json().catch(() => null);
  const lojaId: string | undefined = body?.lojaId;
  if (!lojaId) {
    return Response.json({ erro: "lojaId ausente." }, { status: 400 });
  }

  const { data, error } = await admin
    .from("pedidos")
    .update({ repassado: true, repassado_em: new Date().toISOString() })
    .eq("loja_id", lojaId)
    .eq("status", "Concluído")
    .eq("repassado", false)
    .select("total");
  if (error) {
    return Response.json({ erro: "Falha ao registrar o repasse." }, { status: 500 });
  }

  const rows = (data ?? []) as { total: number | string | null }[];
  const valor = arred(rows.reduce((s, p) => s + (Number(p.total) || 0), 0));
  return Response.json({ repassados: rows.length, valor });
}
