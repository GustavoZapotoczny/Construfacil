"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Home, ClipboardList, Circle, PackageCheck } from "lucide-react";
import { getPedido, atualizarStatusPedido } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { brl, dataHora } from "@/lib/format";
import { Botao } from "@/components/ui/Botao";
import { Carregando } from "@/components/ui/Estados";
import type { StatusPedido } from "@/types";
import { clsx } from "@/lib/cx";

const ETAPAS: StatusPedido[] = [
  "Novo",
  "Em preparo",
  "Pronto",
  "A caminho",
  "Entregue",
  "Concluído",
];

const ROTULOS: Record<StatusPedido, string> = {
  Novo: "Pedido recebido",
  "Em preparo": "Em preparo",
  Pronto: "Pronto para envio",
  "A caminho": "A caminho",
  Entregue: "Entregue",
  "Concluído": "Recebido (confirmado por você)",
  Cancelado: "Cancelado",
};

export default function PedidoPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { data: pedido, loading, reload } = useAsync(() => getPedido(id), [id]);
  const [confirmando, setConfirmando] = useState(false);
  const [erroConfirmar, setErroConfirmar] = useState("");

  async function confirmarRecebimento() {
    setErroConfirmar("");
    setConfirmando(true);
    try {
      await atualizarStatusPedido(id, "Concluído");
      reload();
    } catch (e) {
      setErroConfirmar(
        e instanceof Error ? e.message : "Não foi possível confirmar. Tente novamente.",
      );
    } finally {
      setConfirmando(false);
    }
  }

  if (loading) return <Carregando texto="Carregando pedido…" />;

  if (!pedido) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <p className="text-sm text-stone-500">Pedido não encontrado.</p>
        <Link href="/pedidos" className="mt-4 font-semibold text-orange-600">
          Ver meus pedidos
        </Link>
      </div>
    );
  }

  const etapaAtual = ETAPAS.indexOf(pedido.status as StatusPedido);

  return (
    <div className="min-h-screen pb-8">
      {/* Topo de sucesso */}
      <div className="bg-gradient-to-b from-green-500 to-green-600 px-6 pb-8 pt-14 text-center text-white">
        <CheckCircle2 size={56} className="mx-auto" />
        <h1 className="mt-3 text-xl font-bold">Pedido confirmado!</h1>
        <p className="mt-1 text-sm text-green-50">
          Pedido nº <span className="font-semibold">#{pedido.id.slice(0, 8)}</span>{" "}
          · {pedido.lojaNome}
        </p>
      </div>

      {/* Linha do tempo */}
      <section className="px-6 pt-6">
        <h2 className="mb-3 text-sm font-semibold text-stone-700">
          Acompanhe seu pedido
        </h2>
        <ol className="relative ml-3 border-l-2 border-stone-200">
          {ETAPAS.map((etapa, i) => {
            const concluida = i <= etapaAtual;
            const atual = i === etapaAtual;
            return (
              <li key={etapa} className="mb-5 ml-5 last:mb-0">
                <span
                  className={clsx(
                    "absolute -left-[11px] flex h-5 w-5 items-center justify-center rounded-full",
                    concluida ? "bg-orange-500 text-white" : "bg-stone-200",
                  )}
                >
                  {concluida ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <Circle size={10} className="text-stone-400" />
                  )}
                </span>
                <p
                  className={clsx(
                    "text-sm",
                    atual
                      ? "font-bold text-orange-600"
                      : concluida
                        ? "font-medium text-stone-700"
                        : "text-stone-400",
                  )}
                >
                  {ROTULOS[etapa]}
                </p>
                {atual && (
                  <p className="text-xs text-stone-500">
                    Atualizado em {dataHora(pedido.criadoEm)}
                  </p>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* Confirmação de recebimento (modelo "cofre") */}
      {pedido.status === "Entregue" && (
        <section className="px-6 pt-4">
          <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 text-center">
            <PackageCheck className="mx-auto text-orange-600" size={28} />
            <p className="mt-2 text-sm font-semibold text-stone-800">
              Você já recebeu seu pedido?
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              Confirme o recebimento para concluir. O valor só é repassado à loja
              depois que você confirma.
            </p>
            {erroConfirmar && (
              <p className="mt-2 text-xs text-red-600">{erroConfirmar}</p>
            )}
            <Botao
              className="mt-3"
              bloco
              onClick={confirmarRecebimento}
              disabled={confirmando}
            >
              <CheckCircle2 size={18} />
              {confirmando ? "Confirmando…" : "Confirmar recebimento"}
            </Botao>
          </div>
        </section>
      )}
      {pedido.status === "Concluído" && (
        <section className="px-6 pt-4">
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
            <PackageCheck size={20} className="shrink-0" />
            Recebimento confirmado — pedido concluído. Obrigado! ✅
          </div>
        </section>
      )}

      {/* Itens */}
      <section className="mt-2 px-6">
        <div className="rounded-2xl border border-stone-100 bg-white p-4">
          <h3 className="mb-2 text-sm font-semibold text-stone-700">
            Itens do pedido
          </h3>
          <ul className="space-y-1.5 text-sm">
            {pedido.itens.map((it) => (
              <li key={it.produtoId} className="flex justify-between gap-2">
                <span className="text-stone-600">
                  {it.quantidade}× {it.nome}
                </span>
                <span className="font-medium text-stone-700">
                  {brl(it.precoUnitario * it.quantidade)}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Subtotal</span>
              <span>{brl(pedido.subtotal)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Frete</span>
              <span>{pedido.frete === 0 ? "Grátis" : brl(pedido.frete)}</span>
            </div>
            {pedido.desconto > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Desconto{pedido.cupomCodigo ? ` (${pedido.cupomCodigo})` : ""}
                </span>
                <span>- {brl(pedido.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 text-base font-bold text-stone-800">
              <span>Total pago</span>
              <span>{brl(pedido.total)}</span>
            </div>
          </div>
          {pedido.enderecoResumo && (
            <p className="mt-3 text-xs text-stone-400">
              Entrega em: {pedido.enderecoResumo}
            </p>
          )}
        </div>
      </section>

      {/* Ações */}
      <section className="mt-6 flex gap-3 px-6">
        <Link href="/home" className="flex-1">
          <Botao variante="secundario" bloco>
            <Home size={18} /> Início
          </Botao>
        </Link>
        <Link href="/pedidos" className="flex-1">
          <Botao bloco>
            <ClipboardList size={18} /> Meus pedidos
          </Botao>
        </Link>
      </section>
    </div>
  );
}
