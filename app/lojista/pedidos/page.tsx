"use client";

import { useState } from "react";
import { getMinhaLoja, listarPedidosDaLoja } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { LojistaNav } from "@/components/lojista/LojistaNav";
import { PedidoCard } from "@/components/lojista/PedidoCard";
import { Carregando, ErroCarregar } from "@/components/ui/Estados";
import { clsx } from "@/lib/cx";
import type { StatusPedido } from "@/types";

type Filtro = "Todos" | StatusPedido;

const FILTROS: Filtro[] = [
  "Todos",
  "Novo",
  "Em preparo",
  "Pronto",
  "A caminho",
  "Entregue",
];

export default function LojistaPedidosPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const loja = await getMinhaLoja();
    return loja ? listarPedidosDaLoja(loja.id) : [];
  }, []);
  const pedidos = data ?? [];
  const [filtro, setFiltro] = useState<Filtro>("Todos");

  const lista =
    filtro === "Todos" ? pedidos : pedidos.filter((p) => p.status === filtro);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 border-b border-stone-100 bg-white px-4 pb-2 pt-12">
        <h1 className="text-xl font-bold text-stone-800">Pedidos</h1>
        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          {FILTROS.map((f) => {
            const ativo = filtro === f;
            const qtd =
              f === "Todos"
                ? pedidos.length
                : pedidos.filter((p) => p.status === f).length;
            return (
              <button
                key={f}
                onClick={() => setFiltro(f)}
                className={clsx(
                  "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                  ativo
                    ? "border-orange-500 bg-orange-500 text-white"
                    : "border-stone-200 bg-white text-stone-600",
                )}
              >
                {f} {qtd > 0 && <span className="opacity-70">({qtd})</span>}
              </button>
            );
          })}
        </div>
      </header>

      {loading ? (
        <Carregando />
      ) : error ? (
        <ErroCarregar onRetry={reload} />
      ) : (
        <section className="flex flex-col gap-3 px-4 pt-4">
          {lista.length === 0 ? (
            <div className="rounded-2xl border border-stone-100 bg-white p-8 text-center text-sm text-stone-500">
              Nenhum pedido com status &ldquo;{filtro}&rdquo;.
            </div>
          ) : (
            lista.map((p) => (
              <PedidoCard key={p.id} pedido={p} onChange={reload} />
            ))
          )}
        </section>
      )}

      <LojistaNav />
    </div>
  );
}
