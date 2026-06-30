"use client";

import { useState } from "react";
import { Clock, Check } from "lucide-react";
import type { Pedido, StatusPedido } from "@/types";
import { brl, dataHora } from "@/lib/format";
import { ACAO_STATUS, proximoStatus } from "@/lib/pedidoStatus";
import { atualizarStatusPedido } from "@/lib/repo";
import { Botao } from "@/components/ui/Botao";
import { clsx } from "@/lib/cx";

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

const PAGAMENTO: Record<string, string> = {
  pix: "Pix",
  cartao: "Cartão",
  entrega: "Na entrega",
};

export function PedidoCard({
  pedido,
  onChange,
}: {
  pedido: Pedido;
  /** Chamado após avançar/cancelar para o pai recarregar a lista. */
  onChange?: () => void;
}) {
  const [salvando, setSalvando] = useState(false);

  const novo = pedido.status === "Novo";
  const finalizado =
    pedido.status === "Entregue" || pedido.status === "Cancelado";
  const acao = ACAO_STATUS[pedido.status];

  async function mudar(status: StatusPedido) {
    setSalvando(true);
    try {
      await atualizarStatusPedido(pedido.id, status);
      onChange?.();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div
      className={clsx(
        "rounded-2xl border bg-white p-4 shadow-sm",
        novo ? "border-orange-300 ring-1 ring-orange-200" : "border-stone-100",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-stone-800">
            #{pedido.id.slice(0, 8)} · {pedido.clienteNome ?? "Cliente"}
          </p>
          <p className="flex items-center gap-1 text-xs text-stone-500">
            <Clock size={12} /> {dataHora(pedido.criadoEm)} ·{" "}
            {PAGAMENTO[pedido.formaPagamento] ?? pedido.formaPagamento}
          </p>
        </div>
        <span
          className={clsx(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            CORES_STATUS[pedido.status],
          )}
        >
          {pedido.status}
        </span>
      </div>

      <ul className="mt-2 space-y-0.5 border-t border-stone-100 pt-2 text-sm">
        {pedido.itens.map((it) => (
          <li
            key={it.produtoId}
            className="flex justify-between gap-2 text-stone-600"
          >
            <span className="truncate">
              {it.quantidade}× {it.nome}
            </span>
            <span className="shrink-0 text-stone-500">
              {brl(it.precoUnitario * it.quantidade)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2">
        <span className="text-xs text-stone-500">{pedido.enderecoResumo}</span>
        <span className="text-sm font-bold text-stone-800">
          {brl(pedido.total)}
        </span>
      </div>

      {!finalizado && (
        <div className="mt-3 flex gap-2">
          {novo && (
            <Botao
              variante="fantasma"
              className="px-3 text-red-600 hover:bg-red-50"
              onClick={() => mudar("Cancelado")}
              disabled={salvando}
            >
              Recusar
            </Botao>
          )}
          {acao && (
            <Botao
              bloco
              onClick={() => {
                const prox = proximoStatus(pedido.status);
                if (prox) mudar(prox);
              }}
              disabled={salvando}
            >
              <Check size={16} /> {acao}
            </Botao>
          )}
        </div>
      )}
    </div>
  );
}
