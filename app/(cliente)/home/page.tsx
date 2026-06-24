"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, ShoppingBag, ChevronDown, SlidersHorizontal } from "lucide-react";
import { listarLojas, listarCategorias, listarTodosProdutos } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { BottomNav } from "@/components/cliente/BottomNav";
import { CategoriaCirculo } from "@/components/cliente/CategoriaCirculo";
import { LojaCard } from "@/components/cliente/LojaCard";
import { Carregando, ErroCarregar, Vazio } from "@/components/ui/Estados";
import { useCarrinho } from "@/lib/store";
import { clsx } from "@/lib/cx";

type Filtro = "fretegratis" | "promocao" | "proximo" | "avaliado";

const chips: { id: Filtro; label: string }[] = [
  { id: "fretegratis", label: "Entrega grátis" },
  { id: "promocao", label: "Em promoção" },
  { id: "proximo", label: "Mais próximo" },
  { id: "avaliado", label: "Melhor avaliado" },
];

export default function HomePage() {
  const totalItens = useCarrinho((s) => s.totalItens());
  const [busca, setBusca] = useState("");
  const [categoriaAtiva, setCategoriaAtiva] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro | null>(null);

  const dados = useAsync(
    async () => {
      const [lojas, categorias, produtos] = await Promise.all([
        listarLojas(),
        listarCategorias(),
        listarTodosProdutos(),
      ]);
      return { lojas, categorias, produtos };
    },
    [],
  );

  const lojasVisiveis = useMemo(() => {
    if (!dados.data) return [];
    const { lojas, produtos } = dados.data;
    const produtosDe = (lojaId: string) =>
      produtos.filter((p) => p.lojaId === lojaId);

    let lista = [...lojas];

    if (busca.trim()) {
      const q = busca.toLowerCase();
      lista = lista.filter(
        (l) =>
          l.nome.toLowerCase().includes(q) ||
          l.descricao.toLowerCase().includes(q),
      );
    }

    if (categoriaAtiva) {
      lista = lista.filter((l) =>
        produtosDe(l.id).some((p) => p.categoriaId === categoriaAtiva),
      );
    }

    switch (filtro) {
      case "fretegratis":
        lista = lista.filter((l) => l.taxaEntrega === 0);
        break;
      case "promocao":
        lista = lista.filter((l) =>
          produtosDe(l.id).some((p) => p.desconto > 0),
        );
        break;
      case "proximo":
        lista.sort((a, b) => (a.distanciaKm ?? 99) - (b.distanciaKm ?? 99));
        break;
      case "avaliado":
        lista.sort((a, b) => b.nota - a.nota);
        break;
    }

    return lista.sort((a, b) => Number(b.aberta) - Number(a.aberta));
  }, [dados.data, busca, categoriaAtiva, filtro]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header laranja */}
      <header className="rounded-b-3xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 pb-4 pt-10 text-white">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1.5 text-left">
            <MapPin size={18} />
            <span className="text-sm">
              <span className="block text-xs text-orange-100">Entregar em</span>
              <span className="flex items-center gap-1 font-semibold">
                Obra — Rua dos Pedreiros, 340
                <ChevronDown size={14} />
              </span>
            </span>
          </button>
          <Link
            href="/sacola"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20"
          >
            <ShoppingBag size={20} />
            {totalItens > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-orange-600">
                {totalItens}
              </span>
            )}
          </Link>
        </div>

        {/* Busca */}
        <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-stone-700">
          <Search size={18} className="text-stone-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar lojas e materiais"
            className="w-full bg-transparent text-sm placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </header>

      {dados.loading ? (
        <Carregando texto="Buscando lojas perto de você…" />
      ) : dados.error ? (
        <ErroCarregar onRetry={dados.reload} />
      ) : (
        <>
          {/* Categorias roláveis */}
          <section className="pt-4">
            <div className="no-scrollbar flex gap-3 overflow-x-auto px-4 pb-1">
              {dados.data!.categorias.map((c) => (
                <CategoriaCirculo
                  key={c.id}
                  categoria={c}
                  ativa={categoriaAtiva === c.id}
                  onClick={() =>
                    setCategoriaAtiva((atual) => (atual === c.id ? null : c.id))
                  }
                />
              ))}
            </div>
          </section>

          {/* Banner promocional */}
          <section className="px-4 pt-4">
            <div className="flex items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
              <div>
                <p className="text-xs font-medium text-orange-50">
                  Oferta da semana
                </p>
                <p className="text-lg font-bold leading-tight">
                  Frete grátis acima
                  <br />
                  de R$ 150 🚚
                </p>
              </div>
              <span className="text-5xl">🏗️</span>
            </div>
          </section>

          {/* Chips de filtro */}
          <section className="pt-4">
            <div className="no-scrollbar flex items-center gap-2 overflow-x-auto px-4">
              <span className="flex shrink-0 items-center gap-1 text-stone-400">
                <SlidersHorizontal size={16} />
              </span>
              {chips.map((c) => {
                const ativo = filtro === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setFiltro((f) => (f === c.id ? null : c.id))}
                    className={clsx(
                      "shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                      ativo
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-stone-200 bg-white text-stone-600",
                    )}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Lista de lojas */}
          <section className="flex flex-col gap-3 px-4 pt-4">
            <h2 className="text-sm font-semibold text-stone-500">
              {lojasVisiveis.length} loja{lojasVisiveis.length !== 1 && "s"} perto
              de você
            </h2>
            {lojasVisiveis.length === 0 ? (
              <Vazio
                emoji="🔍"
                titulo="Nenhuma loja encontrada"
                descricao="Tente remover os filtros ou buscar por outro termo."
              />
            ) : (
              lojasVisiveis.map((loja) => <LojaCard key={loja.id} loja={loja} />)
            )}
          </section>
        </>
      )}

      <BottomNav />
    </div>
  );
}
