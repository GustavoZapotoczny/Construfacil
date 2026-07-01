"use client";

import { getMinhaLoja, listarPedidosDaLoja } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { LojistaNav } from "@/components/lojista/LojistaNav";
import { Carregando, ErroCarregar } from "@/components/ui/Estados";
import { brl, dataHora } from "@/lib/format";
import { Wallet, Lock, CircleCheck } from "lucide-react";
import { clsx } from "@/lib/cx";
import type { StatusPedido } from "@/types";

// Pedidos pagos, mas ainda no "cofre" (aguardando o comprador confirmar).
const EM_RETENCAO: StatusPedido[] = [
  "Novo",
  "Em preparo",
  "Pronto",
  "A caminho",
  "Entregue",
];

export default function FinanceiroPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const loja = await getMinhaLoja();
    return loja ? listarPedidosDaLoja(loja.id) : [];
  }, []);
  const pedidos = data ?? [];

  const liberado = pedidos
    .filter((p) => p.status === "Concluído")
    .reduce((s, p) => s + p.total, 0);
  const retido = pedidos
    .filter((p) => EM_RETENCAO.includes(p.status))
    .reduce((s, p) => s + p.total, 0);
  const total = liberado + retido;

  const movimentos = pedidos.filter(
    (p) => p.status === "Concluído" || EM_RETENCAO.includes(p.status),
  );

  return (
    <div className="min-h-screen pb-20">
      <header className="rounded-b-3xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 pb-5 pt-12 text-white">
        <h1 className="text-xl font-bold">Financeiro</h1>
        <p className="mt-0.5 text-sm text-orange-100">
          Total recebido nesta loja
        </p>
        <p className="mt-1 text-3xl font-bold">{brl(total)}</p>
      </header>

      {loading ? (
        <Carregando />
      ) : error ? (
        <ErroCarregar onRetry={reload} />
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 px-4 pt-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <CircleCheck size={20} className="text-emerald-600" />
              <p className="mt-2 text-xs font-medium text-emerald-700">
                Liberado (pode sacar)
              </p>
              <p className="text-lg font-bold text-emerald-800">
                {brl(liberado)}
              </p>
            </div>
            <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
              <Lock size={20} className="text-orange-600" />
              <p className="mt-2 text-xs font-medium text-orange-700">
                Em retenção (cofre)
              </p>
              <p className="text-lg font-bold text-orange-800">{brl(retido)}</p>
            </div>
          </section>

          <section className="px-4 pt-4">
            <div className="flex items-start gap-2 rounded-2xl border border-stone-100 bg-white p-4 text-xs text-stone-500">
              <Wallet size={18} className="mt-0.5 shrink-0 text-stone-400" />
              <p>
                O dinheiro fica na sua conta do{" "}
                <span className="font-medium text-stone-700">Mercado Pago</span>{" "}
                — o saque é feito por lá.{" "}
                <span className="font-medium text-emerald-700">Liberado</span> = o
                comprador confirmou o recebimento.{" "}
                <span className="font-medium text-orange-700">Em retenção</span> =
                aguardando o comprador confirmar.
              </p>
            </div>
          </section>

          <section className="px-4 pt-4">
            <h2 className="mb-2 text-sm font-semibold text-stone-500">
              Movimentações
            </h2>
            {movimentos.length === 0 ? (
              <div className="rounded-2xl border border-stone-100 bg-white p-8 text-center text-sm text-stone-500">
                Nenhuma venda paga ainda.
              </div>
            ) : (
              <div className="divide-y divide-stone-100 rounded-2xl border border-stone-100 bg-white">
                {movimentos.map((p) => {
                  const concluido = p.status === "Concluído";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-stone-800">
                          Pedido #{p.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-stone-400">
                          {dataHora(p.criadoEm)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-stone-800">
                          {brl(p.total)}
                        </p>
                        <span
                          className={clsx(
                            "text-[11px] font-semibold",
                            concluido ? "text-emerald-600" : "text-orange-600",
                          )}
                        >
                          {concluido ? "Liberado" : "Em retenção"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </>
      )}

      <LojistaNav />
    </div>
  );
}
