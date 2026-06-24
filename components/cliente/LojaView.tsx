"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Star, Clock, MapPin, ShoppingBag } from "lucide-react";
import { getLoja, listarProdutos, listarCategorias } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { useCarrinho } from "@/lib/store";
import { brl, distancia } from "@/lib/format";
import { MINIMO_FRETE_GRATIS } from "@/lib/config";
import { ProdutoItem } from "./ProdutoItem";
import { FreteProgress } from "./FreteProgress";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { Carregando, ErroCarregar, Vazio } from "@/components/ui/Estados";
import type { Categoria, Produto } from "@/types";

export function LojaView({ lojaId }: { lojaId: string }) {
  const router = useRouter();
  const [busca, setBusca] = useState("");

  const totalItens = useCarrinho((s) => s.totalItens());
  const subtotalGlobal = useCarrinho((s) => s.subtotal());
  const carrinhoLojaId = useCarrinho((s) => s.lojaId);

  const dados = useAsync(
    async () => {
      const [loja, produtos, categorias] = await Promise.all([
        getLoja(lojaId),
        listarProdutos(lojaId),
        listarCategorias(),
      ]);
      return { loja, produtos, categorias };
    },
    [lojaId],
  );

  const subtotalDestaLoja = carrinhoLojaId === lojaId ? subtotalGlobal : 0;
  const itensDestaLoja = carrinhoLojaId === lojaId ? totalItens : 0;

  const produtos = useMemo(
    () => dados.data?.produtos ?? [],
    [dados.data],
  );
  const produtosFiltrados = useMemo(() => {
    if (!busca.trim()) return produtos;
    const q = busca.toLowerCase();
    return produtos.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.descricao.toLowerCase().includes(q),
    );
  }, [busca, produtos]);

  if (dados.loading) return <Carregando texto="Abrindo a loja…" />;
  if (dados.error)
    return <ErroCarregar onRetry={dados.reload} />;
  if (!dados.data?.loja) {
    return (
      <Vazio emoji="🏚️" titulo="Loja não encontrada" descricao="Ela pode ter saído do ar.">
        <Link href="/home" className="font-semibold text-orange-600">
          Voltar ao início
        </Link>
      </Vazio>
    );
  }

  const loja = dados.data.loja;
  const categorias = dados.data.categorias;

  // categorias presentes nesta loja, na ordem oficial
  const cats: Categoria[] = categorias.filter((c) =>
    produtos.some((p) => p.categoriaId === c.id),
  );

  return (
    <div className="min-h-screen pb-24">
      {/* Capa + voltar */}
      <div className="relative h-32 bg-gradient-to-br from-orange-400 to-amber-500">
        <button
          onClick={() => router.back()}
          aria-label="Voltar"
          className="absolute left-4 top-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow"
        >
          <ArrowLeft size={20} />
        </button>
        <Link
          href="/sacola"
          aria-label="Ver sacola"
          className="absolute right-4 top-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow"
        >
          <ShoppingBag size={18} />
        </Link>
        <span className="absolute bottom-3 right-4 flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white/25 text-4xl drop-shadow backdrop-blur">
          <FotoProduto foto={loja.logo} alt={loja.nome} emojiClassName="text-4xl" />
        </span>
      </div>

      {/* Cartão de info */}
      <div className="-mt-6 px-4">
        <div className="rounded-2xl border border-stone-100 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-bold text-stone-800">{loja.nome}</h1>
          <p className="text-sm text-stone-500">{loja.descricao}</p>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stone-600">
            <span className="flex items-center gap-1">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              {loja.nota.toLocaleString("pt-BR", { minimumFractionDigits: 1 })}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} /> {loja.tempoEstimado}
            </span>
            {distancia(loja.distanciaKm) && (
              <span className="flex items-center gap-1">
                <MapPin size={14} /> {distancia(loja.distanciaKm)}
              </span>
            )}
            <span
              className={
                loja.taxaEntrega === 0
                  ? "font-semibold text-green-600"
                  : "text-stone-600"
              }
            >
              {loja.taxaEntrega === 0
                ? "Frete grátis"
                : `Frete ${brl(loja.taxaEntrega)}`}
            </span>
          </div>
        </div>
      </div>

      {/* Progresso de frete grátis */}
      <div className="px-4 pt-3">
        <FreteProgress subtotal={subtotalDestaLoja} minimo={MINIMO_FRETE_GRATIS} />
      </div>

      {/* Busca interna */}
      <div className="px-4 pt-3">
        <div className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5">
          <Search size={18} className="text-stone-400" />
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder={`Buscar em ${loja.nome}`}
            className="w-full bg-transparent text-sm placeholder:text-stone-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Produtos */}
      <div className="px-4 pt-4">
        {produtos.length === 0 ? (
          <Vazio
            emoji="📦"
            titulo="Sem produtos ainda"
            descricao="Esta loja ainda não cadastrou produtos."
          />
        ) : busca.trim() ? (
          <Secao titulo={`Resultados (${produtosFiltrados.length})`}>
            {produtosFiltrados.map((p) => (
              <ProdutoItem key={p.id} produto={p} />
            ))}
            {produtosFiltrados.length === 0 && (
              <p className="py-6 text-center text-sm text-stone-500">
                Nada encontrado.
              </p>
            )}
          </Secao>
        ) : (
          cats.map((cat) => {
            const lista: Produto[] = produtosFiltrados.filter(
              (p) => p.categoriaId === cat.id,
            );
            if (lista.length === 0) return null;
            return (
              <Secao key={cat.id} titulo={`${cat.emoji} ${cat.nome}`}>
                {lista.map((p) => (
                  <ProdutoItem key={p.id} produto={p} />
                ))}
              </Secao>
            );
          })
        )}
      </div>

      {/* Botão fixo "Ver sacola" */}
      {itensDestaLoja > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md p-4">
          <Link
            href="/sacola"
            className="flex items-center justify-between rounded-2xl bg-orange-500 px-5 py-3.5 text-white shadow-lg transition active:scale-[0.99]"
          >
            <span className="flex items-center gap-2 font-semibold">
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-white/25 px-1.5 text-sm">
                {itensDestaLoja}
              </span>
              Ver sacola
            </span>
            <span className="font-bold">{brl(subtotalDestaLoja)}</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function Secao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-2">
      <h2 className="pb-1 pt-3 text-sm font-bold text-stone-700">{titulo}</h2>
      <div className="divide-y divide-stone-100">{children}</div>
    </section>
  );
}
