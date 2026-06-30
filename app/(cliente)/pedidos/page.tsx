"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { listarPedidosCliente } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { brl, dataHora } from "@/lib/format";
import { BottomNav } from "@/components/cliente/BottomNav";
import { Botao } from "@/components/ui/Botao";
import { Carregando, ErroCarregar, Vazio } from "@/components/ui/Estados";
import type { StatusPedido } from "@/types";
import { clsx } from "@/lib/cx";
import { useRouter } from "next/navigation";

const CORES_STATUS: Record<StatusPedido, string> = {
  "Aguardando pagamento": "bg-yellow-100 text-yellow-800",
  Novo: "bg-orange-100 text-orange-700",
  "Em preparo": "bg-amber-100 text-amber-700",
  Pronto: "bg-blue-100 text-blue-700",
  "A caminho": "bg-indigo-100 text-indigo-700",
  Entregue: "bg-green-100 text-green-700",
  "Concluído": "bg-emerald-100 text-emerald-700",
  Cancelado: "bg-stone-200 text-stone-600",
};

export default function PedidosPage() {
  const router = useRouter();
  const { data, loading, error, reload } = useAsync(listarPedidosCliente, []);
  const pedidos = data ?? [];

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-stone-100 bg-white px-4 pb-3 pt-12">
        <h1 className="text-xl font-bold text-stone-800">Meus pedidos</h1>
      </header>

      {loading ? (
        <Carregando />
      ) : error ? (
        <ErroCarregar onRetry={reload} />
      ) : pedidos.length === 0 ? (
        <Vazio
          emoji="📦"
          titulo="Nenhum pedido ainda"
          descricao="Seus pedidos aparecem aqui depois da primeira compra."
        >
          <Botao onClick={() => router.push("/home")}>Ver lojas</Botao>
        </Vazio>
      ) : (
        <section className="flex flex-col gap-3 px-4 pt-4">
          {pedidos.map((p) => (
            <Link
              key={p.id}
              href={`/pedido/${p.id}`}
              className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-stone-800">
                  {p.lojaNome}
                </span>
                <span
                  className={clsx(
                    "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    CORES_STATUS[p.status],
                  )}
                >
                  {p.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-stone-500">
                Pedido #{p.id.slice(0, 8)} · {dataHora(p.criadoEm)}
              </p>
              <p className="mt-1 truncate text-xs text-stone-500">
                {p.itens.map((it) => `${it.quantidade}× ${it.nome}`).join(", ")}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm font-bold text-stone-800">
                  {brl(p.total)}
                </span>
                <span className="flex items-center gap-0.5 text-sm font-medium text-orange-600">
                  Ver detalhes <ChevronRight size={16} />
                </span>
              </div>
            </Link>
          ))}
        </section>
      )}

      <BottomNav />
    </div>
  );
}
