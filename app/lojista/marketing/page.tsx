"use client";

import { useState } from "react";
import { Ticket, Tag, TrendingUp, Plus, Trash2, X } from "lucide-react";
import {
  getMinhaLoja,
  listarProdutosDaLoja,
  listarCuponsDaLoja,
  criarCupom,
  setCupomAtivo,
  excluirCupom,
  setProdutoDesconto,
} from "@/lib/repo";
import { authDisponivel } from "@/lib/auth";
import { useLojista } from "@/lib/lojista";
import { useAsync } from "@/lib/useAsync";
import { brl, precoComDesconto } from "@/lib/format";
import { Toggle } from "@/components/ui/Toggle";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { LojistaNav } from "@/components/lojista/LojistaNav";
import { MetricCard } from "@/components/lojista/MetricCard";
import { Carregando, ErroCarregar } from "@/components/ui/Estados";
import { clsx } from "@/lib/cx";
import type { TipoCupom } from "@/types";

const ROTULO_TIPO: Record<TipoCupom, string> = {
  percentual: "% de desconto",
  fixo: "R$ de desconto",
  frete: "Frete grátis",
};

const DESCONTOS_RAPIDOS = [0, 5, 10, 20];

export default function MarketingPage() {
  const { data, loading, error, reload } = useAsync(async () => {
    const loja = await getMinhaLoja();
    if (!loja) return null;
    const [produtos, cupons] = await Promise.all([
      listarProdutosDaLoja(loja.id),
      listarCuponsDaLoja(loja.id),
    ]);
    return { loja, produtos, cupons };
  }, []);

  const [criando, setCriando] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<TipoCupom>("percentual");
  const [valor, setValor] = useState("");
  const [validade, setValidade] = useState("");

  // "Usos no mês": sem tabela de uso ainda — mock no demo, 0 no real.
  const usos = authDisponivel ? 0 : useLojista.getState().usosCupomMes;

  if (loading) return <Carregando />;
  if (error || !data)
    return (
      <div className="min-h-screen pb-20">
        <ErroCarregar onRetry={reload} />
        <LojistaNav />
      </div>
    );

  const { loja, produtos, cupons } = data;
  const cuponsAtivos = cupons.filter((c) => c.ativo).length;
  const produtosEmOferta = produtos.filter((p) => p.desconto > 0).length;

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    if (!codigo.trim()) return;
    await criarCupom({
      lojaId: loja.id,
      codigo,
      tipo,
      valor: tipo === "frete" ? 0 : Number(valor) || 0,
      validade: validade.trim() || "Sem prazo",
    });
    setCodigo("");
    setValor("");
    setValidade("");
    setTipo("percentual");
    setCriando(false);
    reload();
  }

  return (
    <div className="min-h-screen pb-20">
      <header className="border-b border-stone-100 bg-white px-4 pb-3 pt-12">
        <h1 className="text-xl font-bold text-stone-800">Marketing</h1>
        <p className="text-sm text-stone-500">Cupons e ofertas da sua loja</p>
      </header>

      <section className="grid grid-cols-3 gap-3 px-4 pt-4">
        <MetricCard icon={Ticket} rotulo="Cupons ativos" valor={String(cuponsAtivos)} />
        <MetricCard icon={Tag} rotulo="Em oferta" valor={String(produtosEmOferta)} />
        <MetricCard icon={TrendingUp} rotulo="Usos no mês" valor={String(usos)} />
      </section>

      {/* Cupons */}
      <section className="px-4 pt-5">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-stone-700">Cupons</h2>
          <button
            onClick={() => setCriando((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-orange-600"
          >
            {criando ? <X size={16} /> : <Plus size={16} />}
            {criando ? "Cancelar" : "Criar cupom"}
          </button>
        </div>

        {criando && (
          <form
            onSubmit={criar}
            className="mb-3 flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-3"
          >
            <Campo
              label="Código"
              placeholder="EX: OBRA15"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            />
            <div>
              <span className="mb-1.5 block text-sm font-medium text-stone-700">
                Tipo
              </span>
              <div className="flex gap-2">
                {(Object.keys(ROTULO_TIPO) as TipoCupom[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTipo(t)}
                    className={clsx(
                      "flex-1 rounded-xl border px-2 py-2 text-xs font-medium transition",
                      tipo === t
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-stone-200 bg-white text-stone-600",
                    )}
                  >
                    {ROTULO_TIPO[t]}
                  </button>
                ))}
              </div>
            </div>
            {tipo !== "frete" && (
              <Campo
                label={tipo === "percentual" ? "Valor (%)" : "Valor (R$)"}
                type="number"
                min="0"
                placeholder="0"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
              />
            )}
            <Campo
              label="Validade"
              placeholder="31/12/2026"
              value={validade}
              onChange={(e) => setValidade(e.target.value)}
            />
            <Botao type="submit" bloco disabled={!codigo.trim()}>
              Criar cupom
            </Botao>
          </form>
        )}

        <div className="flex flex-col gap-2">
          {cupons.length === 0 && (
            <p className="rounded-2xl border border-stone-100 bg-white p-6 text-center text-sm text-stone-500">
              Nenhum cupom ainda.
            </p>
          )}
          {cupons.map((c) => (
            <div
              key={c.id}
              className={clsx(
                "flex items-center gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm",
                !c.ativo && "opacity-60",
              )}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Ticket size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-stone-800">{c.codigo}</p>
                <p className="text-xs text-stone-500">
                  {c.tipo === "frete"
                    ? "Frete grátis"
                    : c.tipo === "percentual"
                      ? `${c.valor}% de desconto`
                      : `${brl(c.valor)} de desconto`}{" "}
                  · até {c.validade}
                </p>
              </div>
              <Toggle
                ligado={c.ativo}
                onChange={async (v) => {
                  await setCupomAtivo(c.id, v);
                  reload();
                }}
                label={`Ativar cupom ${c.codigo}`}
              />
              <button
                onClick={async () => {
                  await excluirCupom(c.id);
                  reload();
                }}
                aria-label={`Excluir cupom ${c.codigo}`}
                className="text-stone-400 transition hover:text-red-600"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Ofertas por produto */}
      <section className="px-4 pt-5">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">
          Ofertas por produto
        </h2>
        <div className="flex flex-col gap-2">
          {produtos.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl border border-stone-100 bg-white p-3 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-stone-100 text-xl">
                  <FotoProduto foto={p.foto} alt={p.nome} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-stone-800">
                    {p.nome}
                  </p>
                  <p className="text-xs text-stone-500">
                    {p.desconto > 0 ? (
                      <>
                        <span className="text-stone-400 line-through">
                          {brl(p.preco)}
                        </span>{" "}
                        <span className="font-semibold text-red-600">
                          {brl(precoComDesconto(p))} (-{p.desconto}%)
                        </span>
                      </>
                    ) : (
                      brl(p.preco)
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-2 flex gap-2">
                {DESCONTOS_RAPIDOS.map((d) => (
                  <button
                    key={d}
                    onClick={async () => {
                      await setProdutoDesconto(p.id, d);
                      reload();
                    }}
                    className={clsx(
                      "flex-1 rounded-lg border py-1.5 text-xs font-semibold transition",
                      p.desconto === d
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-stone-200 bg-white text-stone-600",
                    )}
                  >
                    {d === 0 ? "Sem oferta" : `${d}%`}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <LojistaNav />
    </div>
  );
}
