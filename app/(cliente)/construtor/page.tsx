"use client";

import { useEffect, useRef, useState } from "react";
import { HardHat, Send, Plus, Check } from "lucide-react";
import { listarTodosProdutos } from "@/lib/repo";
import { useCarrinho } from "@/lib/store";
import { brl, precoComDesconto } from "@/lib/format";
import { BottomNav } from "@/components/cliente/BottomNav";
import { clsx } from "@/lib/cx";
import type { Produto } from "@/types";

type Sugestao = { produto: Produto; quantidade: number };
type Mensagem = {
  id: string;
  autor: "user" | "assistant";
  texto: string;
  sugestoes?: Sugestao[];
};

const RAPIDAS = [
  "Quantos sacos de cimento pra uma laje de 30m²?",
  "Quanta tinta pra pintar um quarto de 4x3?",
  "Quantos tijolos pra uma parede de 20m²?",
];

let contador = 0;
const novoId = () => `m${++contador}`;

export default function ConstrutorPage() {
  const adicionar = useCarrinho((s) => s.adicionar);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      id: novoId(),
      autor: "assistant",
      texto:
        "E aí! 👷 Meu Construtor, especialista de obra aqui do ConstruZap.\n\nMe conta o que você vai fazer que eu calculo o material certo, na quantidade certa, e já sugiro os produtos pra você jogar na sacola.",
    },
  ]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [adicionados, setAdicionados] = useState<Record<string, boolean>>({});
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listarTodosProdutos()
      .then(setProdutos)
      .catch(() => setProdutos([]));
  }, []);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, enviando]);

  async function enviar(mensagemTexto: string) {
    const msg = mensagemTexto.trim();
    if (!msg || enviando) return;

    setTexto("");
    const historico = mensagens.map((m) => ({
      role: m.autor,
      content: m.texto,
    }));
    setMensagens((ms) => [...ms, { id: novoId(), autor: "user", texto: msg }]);
    setEnviando(true);

    try {
      const catalogo = produtos.map((p) => ({
        id: p.id,
        nome: p.nome,
        categoria: p.categoriaId,
        preco: precoComDesconto(p),
        unidade: p.unidade,
        estoque: p.estoque,
      }));

      const res = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem: msg, historico, catalogo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.erro || "Erro ao falar com o assistente.");

      const sugestoes: Sugestao[] = (data.sugestoes ?? [])
        .map((s: { produtoId: string; quantidade: number }) => {
          const produto = produtos.find((p) => p.id === s.produtoId);
          return produto ? { produto, quantidade: Math.max(1, s.quantidade || 1) } : null;
        })
        .filter(Boolean);

      setMensagens((ms) => [
        ...ms,
        { id: novoId(), autor: "assistant", texto: data.resposta_texto || "", sugestoes },
      ]);
    } catch (e) {
      const erro = e instanceof Error ? e.message : "Erro inesperado.";
      setMensagens((ms) => [
        ...ms,
        {
          id: novoId(),
          autor: "assistant",
          texto: `Ops, não consegui responder agora 😕\n(${erro})`,
        },
      ]);
    } finally {
      setEnviando(false);
    }
  }

  function adicionarSugestao(s: Sugestao) {
    adicionar(s.produto, s.quantidade);
    setAdicionados((a) => ({ ...a, [s.produto.id]: true }));
  }

  return (
    <div className="flex min-h-screen flex-col pb-32">
      {/* Header laranja */}
      <header className="sticky top-0 z-20 flex items-center gap-3 rounded-b-3xl bg-gradient-to-b from-orange-500 to-orange-600 px-4 pb-4 pt-10 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
          <HardHat size={22} />
        </span>
        <div>
          <h1 className="text-lg font-bold leading-tight">Meu Construtor</h1>
          <p className="text-xs text-orange-100">Assistente de obras • online</p>
        </div>
      </header>

      {/* Mensagens */}
      <div className="flex flex-1 flex-col gap-3 px-4 pt-4">
        {mensagens.map((m) => (
          <div key={m.id} className="flex flex-col gap-2">
            <div
              className={clsx(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                m.autor === "user"
                  ? "self-end bg-orange-500 text-white"
                  : "self-start bg-stone-100 text-stone-800",
              )}
            >
              {m.texto}
            </div>

            {/* Cards de produtos sugeridos */}
            {m.sugestoes && m.sugestoes.length > 0 && (
              <div className="flex flex-col gap-2 self-start">
                {m.sugestoes.map((s) => {
                  const add = adicionados[s.produto.id];
                  return (
                    <div
                      key={s.produto.id}
                      className="flex w-72 items-center gap-3 rounded-xl border border-stone-200 bg-white p-2.5"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-stone-100 text-2xl">
                        {s.produto.foto.startsWith("http") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={s.produto.foto}
                            alt={s.produto.nome}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          s.produto.foto
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-stone-800">
                          {s.produto.nome}
                        </p>
                        <p className="text-xs text-stone-500">
                          {brl(precoComDesconto(s.produto))} / {s.produto.unidade}
                        </p>
                        <p className="text-xs font-medium text-orange-600">
                          Sugestão: {s.quantidade}x
                        </p>
                      </div>
                      <button
                        onClick={() => adicionarSugestao(s)}
                        disabled={add}
                        className={clsx(
                          "flex h-9 shrink-0 items-center gap-1 rounded-lg px-3 text-xs font-semibold transition",
                          add
                            ? "bg-green-100 text-green-700"
                            : "bg-orange-500 text-white",
                        )}
                      >
                        {add ? <Check size={15} /> : <Plus size={15} />}
                        {add ? "Na sacola" : "Adicionar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {enviando && (
          <div className="self-start rounded-2xl bg-stone-100 px-4 py-3 text-sm text-stone-400">
            <span className="inline-flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
            </span>
          </div>
        )}

        {/* Sugestões rápidas (só no início) */}
        {mensagens.length <= 1 && !enviando && (
          <div className="flex flex-col gap-2 pt-2">
            {RAPIDAS.map((r) => (
              <button
                key={r}
                onClick={() => enviar(r)}
                className="self-start rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-left text-sm text-orange-700"
              >
                {r}
              </button>
            ))}
          </div>
        )}

        <div ref={fimRef} />
      </div>

      {/* Campo de entrada */}
      <div className="fixed inset-x-0 bottom-[57px] z-20 mx-auto max-w-md border-t border-stone-200 bg-white px-3 py-2.5 md:bottom-0 md:left-60 md:max-w-4xl">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Pergunte sobre sua obra…"
            disabled={enviando}
            className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2.5 text-sm focus:border-orange-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition disabled:bg-stone-300"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      <BottomNav />
    </div>
  );
}
