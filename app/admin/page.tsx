"use client";

import { carregarLojasAdmin } from "@/lib/adminData";
import { useAsync } from "@/lib/useAsync";
import { Carregando, ErroCarregar } from "@/components/ui/Estados";
import { brl } from "@/lib/format";
import { Store, Wallet, Lock, CircleCheck, Star } from "lucide-react";

// Ordem do fluxo de pedidos para o resumo por status.
const STATUS_ORDEM = [
  "Novo",
  "Em preparo",
  "Pronto",
  "A caminho",
  "Entregue",
  "Concluído",
  "Cancelado",
];

export default function AdminHomePage() {
  const { data, loading, error, reload } = useAsync(carregarLojasAdmin, []);

  if (loading) return <Carregando texto="Carregando lojas…" />;
  if (error) return <ErroCarregar onRetry={reload} />;

  const lojas = data?.lojas ?? [];
  const t = data?.totais;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-stone-800">Visão geral</h1>
        <p className="text-sm text-stone-500">
          Todas as lojas da plataforma e a situação dos pedidos.
        </p>
      </div>

      {/* Totais da plataforma */}
      {t && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Cartao icon={<Store size={18} />} rotulo="Lojas" valor={String(t.lojas)} />
          <Cartao
            icon={<Wallet size={18} />}
            rotulo="Faturamento"
            valor={brl(t.faturamento)}
          />
          <Cartao
            cor="orange"
            icon={<Lock size={18} />}
            rotulo="Em retenção"
            valor={brl(t.emRetencao)}
          />
          <Cartao
            cor="green"
            icon={<CircleCheck size={18} />}
            rotulo="Liberado"
            valor={brl(t.liberado)}
          />
        </div>
      )}

      {/* Lista de lojas */}
      {lojas.length === 0 ? (
        <div className="rounded-2xl border border-stone-100 bg-white p-8 text-center text-sm text-stone-500">
          Nenhuma loja cadastrada ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {lojas.map((l) => (
            <div
              key={l.id}
              className="rounded-2xl border border-stone-100 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl">
                    {l.logo?.startsWith("http") ? "🏪" : l.logo}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-stone-800">{l.nome}</p>
                    <p className="flex items-center gap-1 text-xs text-stone-500">
                      <Star size={12} className="text-amber-400" />
                      {l.nota.toFixed(1)} · {l.pedidosPagos} pedidos pagos
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-stone-400">Faturamento</p>
                  <p className="font-bold text-stone-800">{brl(l.faturamento)}</p>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-lg bg-orange-50 px-3 py-2">
                  <p className="text-xs font-medium text-orange-700">Em retenção</p>
                  <p className="font-semibold text-orange-800">{brl(l.emRetencao)}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 px-3 py-2">
                  <p className="text-xs font-medium text-emerald-700">Liberado</p>
                  <p className="font-semibold text-emerald-800">{brl(l.liberado)}</p>
                </div>
              </div>

              {/* Pedidos por status */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {STATUS_ORDEM.filter((s) => l.porStatus[s]).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-stone-100 px-2.5 py-1 text-[11px] font-medium text-stone-600"
                  >
                    {s}: {l.porStatus[s]}
                  </span>
                ))}
                {STATUS_ORDEM.every((s) => !l.porStatus[s]) && (
                  <span className="text-[11px] text-stone-400">Sem pedidos ainda</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Cartao({
  icon,
  rotulo,
  valor,
  cor,
}: {
  icon: React.ReactNode;
  rotulo: string;
  valor: string;
  cor?: "orange" | "green";
}) {
  const tema =
    cor === "orange"
      ? "border-orange-100 bg-orange-50 text-orange-700"
      : cor === "green"
        ? "border-emerald-100 bg-emerald-50 text-emerald-700"
        : "border-stone-100 bg-white text-stone-500";
  return (
    <div className={`rounded-2xl border p-4 ${tema}`}>
      {icon}
      <p className="mt-2 text-xs font-medium">{rotulo}</p>
      <p className="text-lg font-bold text-stone-800">{valor}</p>
    </div>
  );
}
