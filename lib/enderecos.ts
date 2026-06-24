import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Endereco } from "@/types";
import { enderecos as seed } from "@/lib/data";

interface EnderecosState {
  lista: Endereco[];
  add: (e: Omit<Endereco, "id">) => void;
  update: (id: string, patch: Partial<Endereco>) => void;
  remove: (id: string) => void;
}

/** Endereços no modo demonstração (sem Supabase), persistidos localmente. */
export const useEnderecos = create<EnderecosState>()(
  persist(
    (set) => ({
      lista: seed,
      add: (e) =>
        set((s) => ({
          lista: [...s.lista, { ...e, id: `end-${Date.now().toString(36)}` }],
        })),
      update: (id, patch) =>
        set((s) => ({
          lista: s.lista.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      remove: (id) =>
        set((s) => ({ lista: s.lista.filter((x) => x.id !== id) })),
    }),
    { name: "construfacil-enderecos" },
  ),
);
