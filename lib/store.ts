import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ItemCarrinho, Produto } from "@/types";
import { precoComDesconto } from "@/lib/format";

interface CarrinhoState {
  /** loja atual do carrinho — carrinho é por loja (modelo iFood) */
  lojaId: string | null;
  /** mapa produtoId -> { produto, quantidade } (produto guardado para não
   *  depender de um lookup global — funciona com dados reais e mocks) */
  itens: Record<string, ItemCarrinho>;

  adicionar: (produto: Produto, quantidade?: number) => void;
  definirQuantidade: (produtoId: string, quantidade: number) => void;
  remover: (produtoId: string) => void;
  limpar: () => void;

  // derivados
  totalItens: () => number;
  quantidadeDe: (produtoId: string) => number;
  linhas: () => ItemCarrinho[];
  subtotal: () => number;
}

export const useCarrinho = create<CarrinhoState>()(
  persist(
    (set, get) => ({
      lojaId: null,
      itens: {},

      adicionar: (produto, quantidade = 1) => {
        set((state) => {
          // Trocou de loja: o chamador já deve ter confirmado o esvaziamento.
          const trocouLoja =
            state.lojaId !== null && state.lojaId !== produto.lojaId;
          const base = trocouLoja ? {} : state.itens;
          const atual = base[produto.id]?.quantidade ?? 0;
          return {
            lojaId: produto.lojaId,
            itens: {
              ...base,
              [produto.id]: { produto, quantidade: atual + quantidade },
            },
          };
        });
      },

      definirQuantidade: (produtoId, quantidade) => {
        set((state) => {
          const itens = { ...state.itens };
          if (quantidade <= 0) {
            delete itens[produtoId];
          } else if (itens[produtoId]) {
            itens[produtoId] = { ...itens[produtoId], quantidade };
          }
          const vazio = Object.keys(itens).length === 0;
          return { itens, lojaId: vazio ? null : state.lojaId };
        });
      },

      remover: (produtoId) => {
        set((state) => {
          const itens = { ...state.itens };
          delete itens[produtoId];
          const vazio = Object.keys(itens).length === 0;
          return { itens, lojaId: vazio ? null : state.lojaId };
        });
      },

      limpar: () => set({ itens: {}, lojaId: null }),

      totalItens: () =>
        Object.values(get().itens).reduce((acc, l) => acc + l.quantidade, 0),

      quantidadeDe: (produtoId) => get().itens[produtoId]?.quantidade ?? 0,

      linhas: () => Object.values(get().itens),

      subtotal: () =>
        Object.values(get().itens).reduce(
          (acc, { produto, quantidade }) =>
            acc + precoComDesconto(produto) * quantidade,
          0,
        ),
    }),
    {
      name: "construfacil-carrinho-v2",
      partialize: (state) => ({ lojaId: state.lojaId, itens: state.itens }),
    },
  ),
);
