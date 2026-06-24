import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Pedido } from "@/types";

interface PedidosState {
  pedidos: Pedido[];
  criar: (pedido: Pedido) => void;
  getPedido: (id: string) => Pedido | undefined;
}

/**
 * Histórico de pedidos do cliente. Fase 1: persistido em localStorage.
 * A partir da Fase 4 isto vira leitura/escrita no Supabase.
 */
export const usePedidos = create<PedidosState>()(
  persist(
    (set, get) => ({
      pedidos: [],
      criar: (pedido) =>
        set((state) => ({ pedidos: [pedido, ...state.pedidos] })),
      getPedido: (id) => get().pedidos.find((p) => p.id === id),
    }),
    { name: "construfacil-pedidos" },
  ),
);

/** Gera um número de pedido curto e legível, ex: "#4827". */
export function novoNumeroPedido(): string {
  // Determinístico-ish baseado no horário; suficiente para o mock.
  const n = Math.floor(1000 + (Date.now() % 9000));
  return `${n}`;
}
