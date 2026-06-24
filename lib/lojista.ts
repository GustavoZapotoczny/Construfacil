import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cupom, Produto, StatusPedido, TipoCupom, Pedido } from "@/types";
import {
  LOJA_ATIVA_ID,
  cuponsDaLoja,
  pedidosLojistaSeed,
  produtosDaLoja,
} from "@/lib/data";

// Próximo status no fluxo do lojista (null = não avança mais).
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

interface NovoProdutoInput {
  nome: string;
  categoriaId: string;
  descricao: string;
  foto: string;
  preco: number;
  unidade: string;
  estoque: number;
  disponivel: boolean;
}

interface NovoCupomInput {
  codigo: string;
  tipo: TipoCupom;
  valor: number;
  validade: string;
}

interface LojistaState {
  lojaId: string;
  aberta: boolean;
  produtos: Produto[];
  cupons: Cupom[];
  pedidos: Pedido[];
  usosCupomMes: number;

  toggleAberta: () => void;

  // produtos
  addProduto: (input: NovoProdutoInput) => void;
  toggleDisponivel: (produtoId: string) => void;
  setDesconto: (produtoId: string, desconto: number) => void;

  // cupons
  addCupom: (input: NovoCupomInput) => void;
  toggleCupom: (cupomId: string) => void;
  removeCupom: (cupomId: string) => void;

  // pedidos
  avancarStatus: (pedidoId: string) => void;
  cancelarPedido: (pedidoId: string) => void;
}

function gerarId(prefixo: string): string {
  return `${prefixo}-${Date.now().toString(36)}`;
}

export const useLojista = create<LojistaState>()(
  persist(
    (set) => ({
      lojaId: LOJA_ATIVA_ID,
      aberta: true,
      produtos: produtosDaLoja(LOJA_ATIVA_ID),
      cupons: cuponsDaLoja(LOJA_ATIVA_ID),
      pedidos: pedidosLojistaSeed,
      usosCupomMes: 37,

      toggleAberta: () => set((s) => ({ aberta: !s.aberta })),

      addProduto: (input) =>
        set((s) => ({
          produtos: [
            {
              id: gerarId("prod"),
              lojaId: s.lojaId,
              categoriaId: input.categoriaId,
              nome: input.nome,
              descricao: input.descricao,
              foto: input.foto || "📦",
              preco: input.preco,
              unidade: input.unidade,
              estoque: input.estoque,
              desconto: 0,
              disponivel: input.disponivel,
            },
            ...s.produtos,
          ],
        })),

      toggleDisponivel: (produtoId) =>
        set((s) => ({
          produtos: s.produtos.map((p) =>
            p.id === produtoId ? { ...p, disponivel: !p.disponivel } : p,
          ),
        })),

      setDesconto: (produtoId, desconto) =>
        set((s) => ({
          produtos: s.produtos.map((p) =>
            p.id === produtoId
              ? { ...p, desconto: Math.max(0, Math.min(90, desconto)) }
              : p,
          ),
        })),

      addCupom: (input) =>
        set((s) => ({
          cupons: [
            {
              id: gerarId("cup"),
              lojaId: s.lojaId,
              codigo: input.codigo.trim().toUpperCase(),
              tipo: input.tipo,
              valor: input.valor,
              validade: input.validade,
              ativo: true,
            },
            ...s.cupons,
          ],
        })),

      toggleCupom: (cupomId) =>
        set((s) => ({
          cupons: s.cupons.map((c) =>
            c.id === cupomId ? { ...c, ativo: !c.ativo } : c,
          ),
        })),

      removeCupom: (cupomId) =>
        set((s) => ({ cupons: s.cupons.filter((c) => c.id !== cupomId) })),

      avancarStatus: (pedidoId) =>
        set((s) => ({
          pedidos: s.pedidos.map((p) => {
            if (p.id !== pedidoId) return p;
            const prox = PROXIMO[p.status];
            return prox ? { ...p, status: prox } : p;
          }),
        })),

      cancelarPedido: (pedidoId) =>
        set((s) => ({
          pedidos: s.pedidos.map((p) =>
            p.id === pedidoId ? { ...p, status: "Cancelado" } : p,
          ),
        })),
    }),
    { name: "construfacil-lojista" },
  ),
);
