import { autorizarAdmin } from "@/lib/adminAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pedido pago mas ainda no "cofre" (aguardando o cliente confirmar).
const EM_RETENCAO = ["Novo", "Em preparo", "Pronto", "A caminho", "Entregue"];

interface LojaRow {
  id: string;
  nome: string;
  logo_url: string | null;
  nota: number | string | null;
}
interface PedRow {
  loja_id: string;
  status: string;
  total: number | string | null;
}

/** Visão do admin: todas as lojas com métricas e situação dos pedidos. */
export async function GET(req: Request) {
  const auth = await autorizarAdmin(req);
  if ("erro" in auth) return auth.erro;
  const { admin } = auth;

  const { data: lojasData, error: e1 } = await admin
    .from("lojas")
    .select("id, nome, logo_url, nota");
  if (e1) return Response.json({ erro: "Falha ao ler lojas." }, { status: 500 });

  const { data: pedidosData, error: e2 } = await admin
    .from("pedidos")
    .select("loja_id, status, total");
  if (e2) return Response.json({ erro: "Falha ao ler pedidos." }, { status: 500 });

  const lojas = (lojasData ?? []) as LojaRow[];
  const pedidos = (pedidosData ?? []) as PedRow[];
  const soma = (arr: PedRow[]) =>
    Math.round(arr.reduce((s, p) => s + (Number(p.total) || 0), 0) * 100) / 100;

  const lista = lojas.map((l) => {
    const doLoja = pedidos.filter((p) => p.loja_id === l.id);
    const pagos = doLoja.filter(
      (p) => p.status !== "Aguardando pagamento" && p.status !== "Cancelado",
    );
    const porStatus: Record<string, number> = {};
    doLoja.forEach((p) => {
      porStatus[p.status] = (porStatus[p.status] || 0) + 1;
    });
    return {
      id: l.id,
      nome: l.nome,
      logo: l.logo_url || "🏗️",
      nota: Number(l.nota) || 0,
      totalPedidos: doLoja.length,
      pedidosPagos: pagos.length,
      faturamento: soma(pagos),
      emRetencao: soma(doLoja.filter((p) => EM_RETENCAO.includes(p.status))),
      liberado: soma(doLoja.filter((p) => p.status === "Concluído")),
      porStatus,
    };
  });

  lista.sort((a, b) => b.faturamento - a.faturamento);

  const totais = {
    lojas: lista.length,
    faturamento: soma(pedidos.filter(
      (p) => p.status !== "Aguardando pagamento" && p.status !== "Cancelado",
    )),
    emRetencao: soma(pedidos.filter((p) => EM_RETENCAO.includes(p.status))),
    liberado: soma(pedidos.filter((p) => p.status === "Concluído")),
    pedidos: pedidos.filter(
      (p) => p.status !== "Aguardando pagamento" && p.status !== "Cancelado",
    ).length,
  };

  return Response.json({ lojas: lista, totais });
}
