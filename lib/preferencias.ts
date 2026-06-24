import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FormaPagamento } from "@/types";

interface PreferenciasState {
  pagamentoPadrao: FormaPagamento;
  setPagamentoPadrao: (f: FormaPagamento) => void;
  notifPedidos: boolean;
  notifPromocoes: boolean;
  setNotif: (chave: "notifPedidos" | "notifPromocoes", valor: boolean) => void;
}

/** Preferências do cliente (forma de pagamento padrão, notificações). */
export const usePreferencias = create<PreferenciasState>()(
  persist(
    (set) => ({
      pagamentoPadrao: "pix",
      setPagamentoPadrao: (f) => set({ pagamentoPadrao: f }),
      notifPedidos: true,
      notifPromocoes: true,
      setNotif: (chave, valor) => set({ [chave]: valor } as Partial<PreferenciasState>),
    }),
    { name: "construfacil-preferencias" },
  ),
);
