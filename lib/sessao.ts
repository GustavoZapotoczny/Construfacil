import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { TipoUsuario } from "@/types";

interface Usuario {
  nome: string;
  email: string;
  tipo: TipoUsuario;
}

interface SessaoState {
  usuario: Usuario | null;
  entrar: (usuario: Usuario) => void;
  sair: () => void;
}

/**
 * Sessão fake da Fase 1/2 — login sem backend.
 * Na Fase 3 isto é substituído pelo Supabase Auth.
 */
export const useSessao = create<SessaoState>()(
  persist(
    (set) => ({
      usuario: null,
      entrar: (usuario) => set({ usuario }),
      sair: () => set({ usuario: null }),
    }),
    { name: "construfacil-sessao" },
  ),
);
