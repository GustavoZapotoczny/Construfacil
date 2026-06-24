import type { StatusPedido } from "@/types";

// Próximo status no fluxo do lojista (undefined = não avança mais).
const PROXIMO: Partial<Record<StatusPedido, StatusPedido>> = {
  Novo: "Em preparo",
  "Em preparo": "Pronto",
  Pronto: "A caminho",
  "A caminho": "Entregue",
};

/** Rótulo do botão que avança o pedido, conforme o status atual. */
export const ACAO_STATUS: Partial<Record<StatusPedido, string>> = {
  Novo: "Aceitar pedido",
  "Em preparo": "Marcar como pronto",
  Pronto: "Saiu para entrega",
  "A caminho": "Marcar entregue",
};

export function proximoStatus(status: StatusPedido): StatusPedido | undefined {
  return PROXIMO[status];
}
