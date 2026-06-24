"use client";

import { DollarSign, ShoppingCart, Receipt, CheckCircle2 } from "lucide-react";
import { getMinhaLoja, listarPedidosDaLoja } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { SubHeader } from "@/components/lojista/SubHeader";
import { MetricCard } from "@/components/lojista/MetricCard";
import { Carregando, ErroCarregar, Vazio } from "@/components/ui/Estados";
import { brl } from "@/lib/format";
import type { StatusPedido } from "@/types";

export default function RelatoriosPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const loja = await getMinhaLoja();
    return loja ? listarPedidosDaLoja(loja.id) : [];
  }, []);

  if (loading) return <Carregando />;
  if (error) return <ErroCarregar onRetry={reload} />;

  const pedidos = data ?? [];
  const validos = pedidos.filter((p) => p.status !== "Cancelado");
  const totalVendido = validos.reduce((acc, p) => acc + p.total, 0);
  const ticket = validos.length ? totalVendido / validos.length : 0;
  const entregues = pedidos.filter((p) => p.status === "Entregue").length;

  // contagem por status
  const porStatus = pedidos.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});
  const ordemStatus: StatusPedido[] = [
    "Novo",
    "Em preparo",
    "Pronto",
    "A caminho",
    "Entregue",
    "Cancelado",
  ];

  // top produtos por quantidade
  const porProduto = new Map<string, { nome: string; qtd: number; valor: number }>();
  for (const p of validos) {
    for (const it of p.itens) {
      const cur = porProduto.get(it.nome) ?? { nome: it.nome, qtd: 0, valor: 0 };
      cur.qtd += it.quantidade;
      cur.valor += it.precoUnitario * it.quantidade;
      porProduto.set(it.nome, cur);
    }
  }
  const top = Array.from(porProduto.values())
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 5);

  return (
    <div className="min-h-screen pb-10">
      <SubHeader titulo="Relatórios de vendas" />

      {pedidos.length === 0 ? (
        <Vazio
          emoji="📊"
          titulo="Sem dados ainda"
          descricao="Os relatórios aparecem assim que você receber pedidos."
        />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 px-4 pt-4">
            <MetricCard icon={DollarSign} rotulo="Total vendido" valor={brl(totalVendido)} />
            <MetricCard icon={ShoppingCart} rotulo="Pedidos válidos" valor={String(validos.length)} />
            <MetricCard icon={Receipt} rotulo="Ticket médio" valor={brl(ticket)} />
            <MetricCard icon={CheckCircle2} rotulo="Entregues" valor={String(entregues)} />
          </section>

          <section className="px-4 pt-5">
            <h2 className="mb-2 text-sm font-semibold text-stone-700">
              Pedidos por status
            </h2>
            <div className="rounded-2xl border border-stone-100 bg-white p-4">
              {ordemStatus
                .filter((s) => porStatus[s])
                .map((s) => (
                  <div
                    key={s}
                    className="flex items-center justify-between border-b border-stone-50 py-1.5 text-sm last:border-0"
                  >
                    <span className="text-stone-600">{s}</span>
                    <span className="font-semibold text-stone-800">
                      {porStatus[s]}
                    </span>
                  </div>
                ))}
            </div>
          </section>

          <section className="px-4 pt-5">
            <h2 className="mb-2 text-sm font-semibold text-stone-700">
              Produtos mais vendidos
            </h2>
            <div className="rounded-2xl border border-stone-100 bg-white p-4">
              {top.length === 0 ? (
                <p className="text-sm text-stone-500">Sem itens vendidos ainda.</p>
              ) : (
                top.map((p, i) => (
                  <div
                    key={p.nome}
                    className="flex items-center gap-3 border-b border-stone-50 py-2 last:border-0"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-50 text-xs font-bold text-orange-600">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm text-stone-700">
                      {p.nome}
                    </span>
                    <span className="text-xs text-stone-400">{p.qtd}×</span>
                    <span className="text-sm font-semibold text-stone-800">
                      {brl(p.valor)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
