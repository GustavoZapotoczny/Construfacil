"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";
import {
  getMinhaLoja,
  listarProdutosDaLoja,
  setProdutoDisponivel,
} from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { brl, precoComDesconto } from "@/lib/format";
import { Toggle } from "@/components/ui/Toggle";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { LojistaNav } from "@/components/lojista/LojistaNav";
import { Carregando, ErroCarregar, Vazio } from "@/components/ui/Estados";
import { clsx } from "@/lib/cx";

export default function LojistaProdutosPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const loja = await getMinhaLoja();
    return loja ? listarProdutosDaLoja(loja.id) : [];
  }, []);
  const produtos = data ?? [];
  const [busca, setBusca] = useState("");

  const lista = busca.trim()
    ? produtos.filter((p) => p.nome.toLowerCase().includes(busca.toLowerCase()))
    : produtos;

  async function alternar(id: string, disponivel: boolean) {
    await setProdutoDisponivel(id, disponivel);
    reload();
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-20 border-b border-stone-100 bg-white px-4 pb-3 pt-12">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-stone-800">Produtos</h1>
          <Link
            href="/lojista/produtos/novo"
            className="flex items-center gap-1 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white transition active:scale-[0.98]"
          >
            <Plus size={16} /> Novo
          </Link>
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2">
          <Search size={18} className="text-stone-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar produto"
            className="w-full bg-transparent text-sm placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </header>

      {loading ? (
        <Carregando />
      ) : error ? (
        <ErroCarregar onRetry={reload} />
      ) : produtos.length === 0 ? (
        <Vazio
          emoji="📦"
          titulo="Nenhum produto"
          descricao="Cadastre o primeiro produto da sua loja."
        >
          <Link
            href="/lojista/produtos/novo"
            className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Novo produto
          </Link>
        </Vazio>
      ) : (
        <section className="flex flex-col gap-3 px-4 pt-4">
          {lista.map((p) => {
            const esgotado = p.estoque <= 0;
            const baixo = p.estoque > 0 && p.estoque <= 5;
            const temDesconto = p.desconto > 0;
            return (
              <div
                key={p.id}
                className={clsx(
                  "flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm",
                  !p.disponivel && "opacity-60",
                )}
              >
                <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-2xl">
                  <FotoProduto foto={p.foto} alt={p.nome} />
                  {temDesconto && (
                    <span className="absolute -left-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      -{p.desconto}%
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-stone-800">
                    {p.nome}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-stone-800">
                      {brl(precoComDesconto(p))}
                    </span>
                    {temDesconto && (
                      <span className="text-xs text-stone-400 line-through">
                        {brl(p.preco)}
                      </span>
                    )}
                  </div>
                  <span
                    className={clsx(
                      "text-xs font-medium",
                      esgotado
                        ? "text-red-600"
                        : baixo
                          ? "text-amber-600"
                          : "text-stone-500",
                    )}
                  >
                    {esgotado
                      ? "Esgotado"
                      : baixo
                        ? `Estoque baixo: ${p.estoque}`
                        : `${p.estoque} em estoque`}
                  </span>
                </div>

                <div className="flex flex-col items-center gap-1">
                  <Toggle
                    ligado={p.disponivel}
                    onChange={(v) => alternar(p.id, v)}
                    label={`Disponibilidade de ${p.nome}`}
                  />
                  <span className="text-[10px] text-stone-400">
                    {p.disponivel ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}

      <LojistaNav />
    </div>
  );
}
