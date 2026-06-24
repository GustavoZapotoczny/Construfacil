"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DollarSign, ShoppingCart, Receipt, Star, ChevronRight } from "lucide-react";
import { getMinhaLoja, listarPedidosDaLoja, setLojaAberta } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { vendasSemana } from "@/lib/data";
import { brl } from "@/lib/format";
import { Toggle } from "@/components/ui/Toggle";
import { LojistaNav } from "@/components/lojista/LojistaNav";
import { MetricCard } from "@/components/lojista/MetricCard";
import { GraficoBarras } from "@/components/lojista/GraficoBarras";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { PedidoCard } from "@/components/lojista/PedidoCard";
import { Carregando, ErroCarregar } from "@/components/ui/Estados";

export default function LojistaDashboard() {
  const { data, loading, error, reload } = useAsync(async () => {
    const loja = await getMinhaLoja();
    if (!loja) return { loja: null, pedidos: [] };
    const pedidos = await listarPedidosDaLoja(loja.id);
    return { loja, pedidos };
  }, []);

  const [aberta, setAberta] = useState(true);
  useEffect(() => {
    if (data?.loja) setAberta(data.loja.aberta);
  }, [data?.loja]);

  if (loading) return <Carregando />;
  if (error || !data?.loja)
    return (
      <div className="min-h-screen pb-20">
        <ErroCarregar onRetry={reload} mensagem="Não foi possível carregar o painel." />
        <LojistaNav />
      </div>
    );

  const { loja, pedidos } = data;

  async function toggleAberta() {
    const novo = !aberta;
    setAberta(novo);
    try {
      await setLojaAberta(loja!.id, novo);
    } catch {
      setAberta(!novo); // reverte em caso de erro
    }
  }

  const dataHoje = pedidos[0]?.criadoEm.slice(0, 10);
  const pedidosHoje = pedidos.filter(
    (p) => p.criadoEm.slice(0, 10) === dataHoje && p.status !== "Cancelado",
  );
  const vendasHoje = pedidosHoje.reduce((acc, p) => acc + p.total, 0);
  const ticketMedio =
    pedidosHoje.length > 0 ? vendasHoje / pedidosHoje.length : 0;
  const recentes = pedidos.slice(0, 2);

  return (
    <div className="min-h-screen pb-20">
      <header className="rounded-b-3xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 pb-5 pt-12 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/20 text-2xl">
            <FotoProduto foto={loja.logo} alt={loja.nome} emojiClassName="text-2xl" />
          </span>
          <div>
            <h1 className="text-lg font-bold leading-tight">{loja.nome}</h1>
            <p className="text-xs text-orange-100">Painel do lojista</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-white/15 px-3 py-2.5 backdrop-blur">
          <span className="text-sm font-medium">
            {aberta ? "Loja aberta — recebendo pedidos" : "Loja fechada"}
          </span>
          <Toggle ligado={aberta} onChange={toggleAberta} label="Loja aberta" />
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 px-4 pt-4">
        <MetricCard
          icon={DollarSign}
          rotulo="Vendas hoje"
          valor={brl(vendasHoje)}
          variacao={vendasHoje > 0 ? "+12% vs ontem" : undefined}
        />
        <MetricCard
          icon={ShoppingCart}
          rotulo="Pedidos hoje"
          valor={String(pedidosHoje.length)}
        />
        <MetricCard icon={Receipt} rotulo="Ticket médio" valor={brl(ticketMedio)} />
        <MetricCard
          icon={Star}
          rotulo="Avaliação"
          valor={loja.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
        />
      </section>

      <section className="px-4 pt-4">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">
          Vendas da semana
        </h2>
        <GraficoBarras dados={vendasSemana} />
      </section>

      <section className="px-4 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700">
            Pedidos recentes
          </h2>
          <Link
            href="/lojista/pedidos"
            className="flex items-center gap-0.5 text-sm font-medium text-orange-600"
          >
            Ver todos <ChevronRight size={16} />
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          {recentes.length === 0 ? (
            <p className="rounded-2xl border border-stone-100 bg-white p-6 text-center text-sm text-stone-500">
              Nenhum pedido ainda.
            </p>
          ) : (
            recentes.map((p) => (
              <PedidoCard key={p.id} pedido={p} onChange={reload} />
            ))
          )}
        </div>
      </section>

      <LojistaNav />
    </div>
  );
}
