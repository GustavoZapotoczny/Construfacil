"use client";

import { Plus } from "lucide-react";
import type { Produto } from "@/types";
import { brl, precoComDesconto } from "@/lib/format";
import { useCarrinho } from "@/lib/store";
import { SeletorQuantidade } from "./SeletorQuantidade";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { clsx } from "@/lib/cx";

export function ProdutoItem({ produto }: { produto: Produto }) {
  const quantidade = useCarrinho((s) => s.quantidadeDe(produto.id));
  const carrinhoLojaId = useCarrinho((s) => s.lojaId);
  const adicionar = useCarrinho((s) => s.adicionar);
  const definirQuantidade = useCarrinho((s) => s.definirQuantidade);
  const limpar = useCarrinho((s) => s.limpar);

  const esgotado = produto.estoque <= 0 || !produto.disponivel;
  const temDesconto = produto.desconto > 0;
  const preco = precoComDesconto(produto);

  function handleAdicionar() {
    if (esgotado) return;
    // Carrinho é por loja: se já há itens de outra loja, confirmar troca.
    if (carrinhoLojaId && carrinhoLojaId !== produto.lojaId) {
      const ok = window.confirm(
        "Seu carrinho tem itens de outra loja. Deseja esvaziá-lo para adicionar este item?",
      );
      if (!ok) return;
      limpar();
    }
    adicionar(produto);
  }

  return (
    <div
      className={clsx(
        "flex gap-3 py-3",
        esgotado && "opacity-60",
      )}
    >
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-3xl">
        <FotoProduto foto={produto.foto} alt={produto.nome} />
        {temDesconto && !esgotado && (
          <span className="absolute -left-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{produto.desconto}%
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-stone-800">{produto.nome}</h4>
        <p className="line-clamp-2 text-xs text-stone-500">
          {produto.descricao}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-sm font-bold text-stone-800">{brl(preco)}</span>
          {temDesconto && (
            <span className="text-xs text-stone-400 line-through">
              {brl(produto.preco)}
            </span>
          )}
          <span className="text-xs text-stone-400">/ {produto.unidade}</span>
        </div>
        {esgotado ? (
          <span className="mt-1 inline-block text-xs font-semibold text-red-600">
            Esgotado
          </span>
        ) : produto.estoque <= 5 ? (
          <span className="mt-1 inline-block text-xs font-medium text-amber-600">
            Últimas {produto.estoque} unidades
          </span>
        ) : null}
      </div>

      <div className="flex items-end">
        {esgotado ? null : quantidade > 0 ? (
          <SeletorQuantidade
            quantidade={quantidade}
            onIncrementar={() => definirQuantidade(produto.id, quantidade + 1)}
            onDecrementar={() => definirQuantidade(produto.id, quantidade - 1)}
            lixeiraNoUm
            tamanho="sm"
          />
        ) : (
          <button
            type="button"
            onClick={handleAdicionar}
            aria-label={`Adicionar ${produto.nome}`}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm transition active:scale-95"
          >
            <Plus size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
