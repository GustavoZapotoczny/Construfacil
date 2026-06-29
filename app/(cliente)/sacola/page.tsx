"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ShoppingBag,
  Tag,
  MapPin,
  Check,
  CreditCard,
  Banknote,
  QrCode,
  Plus,
  Trash2,
} from "lucide-react";
import { useCarrinho } from "@/lib/store";
import { getLoja, validarCupom, criarPedido, listarEnderecos } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { usePreferencias } from "@/lib/preferencias";
import { brl, precoComDesconto } from "@/lib/format";
import { MINIMO_FRETE_GRATIS } from "@/lib/config";
import { SeletorQuantidade } from "@/components/cliente/SeletorQuantidade";
import { PagamentoBrick } from "@/components/cliente/PagamentoBrick";
import { Botao } from "@/components/ui/Botao";
import { Carregando } from "@/components/ui/Estados";
import { clsx } from "@/lib/cx";
import type { Cupom, FormaPagamento } from "@/types";

const pagamentos: { id: FormaPagamento; label: string; icon: typeof QrCode }[] = [
  { id: "pix", label: "Pix", icon: QrCode },
  { id: "cartao", label: "Cartão", icon: CreditCard },
  { id: "entrega", label: "Pagar na entrega", icon: Banknote },
];

export default function SacolaPage() {
  const router = useRouter();
  const linhas = useCarrinho((s) => s.linhas());
  const subtotal = useCarrinho((s) => s.subtotal());
  const lojaId = useCarrinho((s) => s.lojaId);
  const definirQuantidade = useCarrinho((s) => s.definirQuantidade);
  const remover = useCarrinho((s) => s.remover);
  const limpar = useCarrinho((s) => s.limpar);

  function esvaziarSacola() {
    if (window.confirm("Tem certeza que deseja esvaziar a sacola?")) limpar();
  }

  const lojaAsync = useAsync(
    async () => (lojaId ? await getLoja(lojaId) : null),
    [lojaId],
  );
  const loja = lojaAsync.data;

  const enderecosAsync = useAsync(listarEnderecos, []);
  const enderecos = useMemo(() => enderecosAsync.data ?? [], [enderecosAsync.data]);
  const pagamentoPadrao = usePreferencias((s) => s.pagamentoPadrao);

  const [codigoCupom, setCodigoCupom] = useState("");
  const [cupom, setCupom] = useState<Cupom | null>(null);
  const [erroCupom, setErroCupom] = useState("");
  const [validandoCupom, setValidandoCupom] = useState(false);
  const [enderecoId, setEnderecoId] = useState("");
  const [pagamento, setPagamento] = useState<FormaPagamento>(pagamentoPadrao);
  const [finalizando, setFinalizando] = useState(false);
  const [erroFinalizar, setErroFinalizar] = useState("");
  const [mostrarPagamento, setMostrarPagamento] = useState(false);

  // Seleciona o primeiro endereço assim que a lista carrega.
  useEffect(() => {
    if (!enderecoId && enderecos.length) setEnderecoId(enderecos[0].id);
  }, [enderecos, enderecoId]);

  const { frete, desconto, total } = useMemo(() => {
    if (!loja) return { frete: 0, desconto: 0, total: 0 };
    let frete = loja.taxaEntrega;
    if (subtotal >= MINIMO_FRETE_GRATIS) frete = 0;

    let desconto = 0;
    if (cupom) {
      if (cupom.tipo === "frete") frete = 0;
      else if (cupom.tipo === "percentual")
        desconto = subtotal * (cupom.valor / 100);
      else if (cupom.tipo === "fixo") desconto = Math.min(cupom.valor, subtotal);
    }
    const total = Math.max(0, subtotal - desconto) + frete;
    return { frete, desconto, total };
  }, [loja, subtotal, cupom]);

  async function aplicarCupom() {
    setErroCupom("");
    if (!loja) return;
    const codigo = codigoCupom.trim();
    if (!codigo) return;
    setValidandoCupom(true);
    try {
      const encontrado = await validarCupom(loja.id, codigo);
      if (!encontrado) {
        setCupom(null);
        setErroCupom("Cupom inválido para esta loja.");
      } else {
        setCupom(encontrado);
      }
    } catch {
      setErroCupom("Não foi possível validar o cupom.");
    } finally {
      setValidandoCupom(false);
    }
  }

  function abrirPagamento() {
    if (!loja) return;
    if (enderecos.length > 0 && !enderecoId) {
      setErroFinalizar("Selecione um endereço de entrega.");
      return;
    }
    setErroFinalizar("");
    setMostrarPagamento(true);
  }

  // Chamado pelo PagamentoBrick quando o pagamento é confirmado (cartão/Pix).
  async function concluirPedido() {
    if (!loja) return;
    setFinalizando(true);
    const endereco = enderecos.find((e) => e.id === enderecoId);
    try {
      const id = await criarPedido({
        loja,
        linhas,
        subtotal,
        frete,
        desconto,
        total,
        formaPagamento: pagamento,
        cupomCodigo: cupom?.codigo,
        enderecoId: endereco?.id,
        enderecoResumo: endereco
          ? `${endereco.rua}, ${endereco.numero} — ${endereco.apelido}`
          : "Endereço não informado",
      });
      limpar();
      router.push(`/pedido/${id}`);
    } catch (e) {
      setFinalizando(false);
      setErroFinalizar(
        e instanceof Error
          ? e.message
          : "Pagamento aprovado, mas houve um erro ao registrar o pedido. Fale com o suporte.",
      );
    }
  }

  if (lojaId && lojaAsync.loading) return <Carregando texto="Carregando sacola…" />;

  // Carrinho vazio
  if (linhas.length === 0 || !loja) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-8 text-center">
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-4xl">
          🛒
        </div>
        <h1 className="text-lg font-bold text-stone-800">
          Sua sacola está vazia
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Adicione materiais de uma loja para começar seu pedido.
        </p>
        <Botao className="mt-6" onClick={() => router.push("/home")}>
          Ver lojas
        </Botao>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-40">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-100 bg-white px-4 py-3">
        <button onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft size={22} className="text-stone-700" />
        </button>
        <div>
          <h1 className="font-bold text-stone-800">Sua sacola</h1>
          <p className="text-xs text-stone-500">{loja.nome}</p>
        </div>
      </header>

      {/* Itens */}
      <section className="bg-white px-4">
        <div className="flex items-center justify-between border-b border-stone-100 py-3">
          <h2 className="text-sm font-semibold text-stone-700">
            {linhas.length} {linhas.length === 1 ? "item" : "itens"}
          </h2>
          <button
            type="button"
            onClick={esvaziarSacola}
            className="flex items-center gap-1 text-xs font-medium text-stone-400 transition hover:text-red-500"
          >
            <Trash2 size={14} /> Esvaziar sacola
          </button>
        </div>
        <div className="divide-y divide-stone-100">
          {linhas.map(({ produto, quantidade }) => (
            <div key={produto.id} className="flex items-center gap-3 py-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-2xl">
                {produto.foto.startsWith("http") || produto.foto.startsWith("data:") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={produto.foto}
                    alt={produto.nome}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  produto.foto
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold text-stone-800">
                  {produto.nome}
                </h3>
                <p className="text-xs text-stone-500">
                  {brl(precoComDesconto(produto))} / {produto.unidade}
                </p>
                <p className="mt-0.5 text-sm font-bold text-stone-800">
                  {brl(precoComDesconto(produto) * quantidade)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <button
                  type="button"
                  onClick={() => remover(produto.id)}
                  aria-label="Remover item da sacola"
                  className="text-stone-400 transition hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
                <SeletorQuantidade
                  quantidade={quantidade}
                  onIncrementar={() => definirQuantidade(produto.id, quantidade + 1)}
                  onDecrementar={() => definirQuantidade(produto.id, quantidade - 1)}
                  tamanho="sm"
                />
              </div>
            </div>
          ))}
        </div>
        <Link
          href={`/loja/${loja.id}`}
          className="block py-3 text-center text-sm font-semibold text-orange-600"
        >
          + Adicionar mais itens
        </Link>
      </section>

      {/* Cupom */}
      <section className="mt-3 bg-white px-4 py-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
          <Tag size={16} /> Cupom de desconto
        </h2>
        <div className="flex gap-2">
          <input
            value={codigoCupom}
            onChange={(e) => setCodigoCupom(e.target.value)}
            placeholder="Digite o código"
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm uppercase placeholder:normal-case placeholder:text-stone-400 focus:border-orange-500 focus:outline-none"
          />
          <Botao variante="secundario" onClick={aplicarCupom} disabled={validandoCupom}>
            {validandoCupom ? "..." : "Aplicar"}
          </Botao>
        </div>
        {erroCupom && <p className="mt-1.5 text-xs text-red-600">{erroCupom}</p>}
        {cupom && (
          <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-green-600">
            <Check size={14} /> Cupom {cupom.codigo} aplicado
          </p>
        )}
      </section>

      {/* Endereço */}
      <section className="mt-3 bg-white px-4 py-4">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-stone-700">
          <MapPin size={16} /> Entregar em
        </h2>
        {enderecos.length === 0 && !enderecosAsync.loading && (
          <Link
            href="/perfil/enderecos"
            className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-orange-300 py-3 text-sm font-semibold text-orange-600"
          >
            <Plus size={16} /> Cadastrar endereço de entrega
          </Link>
        )}
        <div className="flex flex-col gap-2">
          {enderecos.map((e) => {
            const ativo = enderecoId === e.id;
            return (
              <button
                key={e.id}
                onClick={() => setEnderecoId(e.id)}
                className={clsx(
                  "flex items-start gap-3 rounded-xl border p-3 text-left transition",
                  ativo
                    ? "border-orange-500 bg-orange-50"
                    : "border-stone-200 bg-white",
                )}
              >
                <span
                  className={clsx(
                    "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border",
                    ativo
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-stone-300",
                  )}
                >
                  {ativo && <Check size={12} />}
                </span>
                <span className="text-sm">
                  <span className="block font-semibold text-stone-800">
                    {e.apelido}
                  </span>
                  <span className="text-stone-500">
                    {e.rua}, {e.numero}
                    {e.complemento ? ` — ${e.complemento}` : ""} · {e.cidade}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {enderecos.length > 0 && (
          <Link
            href="/perfil/enderecos"
            className="mt-2 block text-center text-xs font-semibold text-orange-600"
          >
            + Gerenciar endereços
          </Link>
        )}
      </section>

      {/* Pagamento */}
      <section className="mt-3 bg-white px-4 py-4">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">
          Forma de pagamento
        </h2>
        <div className="flex flex-col gap-2">
          {pagamentos.map(({ id, label, icon: Icon }) => {
            const ativo = pagamento === id;
            return (
              <button
                key={id}
                onClick={() => setPagamento(id)}
                className={clsx(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition",
                  ativo
                    ? "border-orange-500 bg-orange-50"
                    : "border-stone-200 bg-white",
                )}
              >
                <Icon size={20} className={ativo ? "text-orange-600" : "text-stone-500"} />
                <span className="flex-1 text-sm font-medium text-stone-800">
                  {label}
                </span>
                <span
                  className={clsx(
                    "flex h-5 w-5 items-center justify-center rounded-full border",
                    ativo
                      ? "border-orange-500 bg-orange-500 text-white"
                      : "border-stone-300",
                  )}
                >
                  {ativo && <Check size={12} />}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Resumo */}
      <section className="mt-3 bg-white px-4 py-4">
        <h2 className="mb-2 text-sm font-semibold text-stone-700">Resumo</h2>
        <dl className="space-y-1.5 text-sm">
          <Linha rotulo="Subtotal" valor={brl(subtotal)} />
          <Linha
            rotulo="Frete"
            valor={frete === 0 ? "Grátis" : brl(frete)}
            destaque={frete === 0 ? "verde" : undefined}
          />
          {desconto > 0 && (
            <Linha rotulo="Desconto" valor={`- ${brl(desconto)}`} destaque="verde" />
          )}
          <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2 text-base font-bold text-stone-800">
            <span>Total</span>
            <span>{brl(total)}</span>
          </div>
        </dl>
      </section>

      {/* Botão fixo finalizar */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-100 bg-white p-4 md:left-60 md:max-w-4xl">
        {erroFinalizar && (
          <p className="mb-2 text-center text-xs text-red-600">{erroFinalizar}</p>
        )}
        <Botao bloco onClick={abrirPagamento} disabled={finalizando}>
          <ShoppingBag size={18} />
          {finalizando ? "Finalizando…" : `Pagar · ${brl(total)}`}
        </Botao>
      </div>

      {/* Modal de pagamento (Pix + cartão dentro do app) */}
      {mostrarPagamento && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center"
          onClick={() => !finalizando && setMostrarPagamento(false)}
        >
          <div
            className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-3xl bg-white p-5 md:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-lg font-bold text-stone-800">Pagamento</h2>
              <button
                onClick={() => setMostrarPagamento(false)}
                aria-label="Fechar"
                className="text-xl leading-none text-stone-400"
              >
                ×
              </button>
            </div>
            <p className="mb-4 text-sm text-stone-500">
              Total a pagar:{" "}
              <span className="font-bold text-stone-800">{brl(total)}</span>
            </p>
            <PagamentoBrick
              valor={total}
              descricao={`Pedido • ${loja.nome}`}
              onAprovado={() => concluirPedido()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Linha({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: string;
  destaque?: "verde";
}) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-stone-500">{rotulo}</dt>
      <dd
        className={clsx(
          "font-medium",
          destaque === "verde" ? "text-green-600" : "text-stone-700",
        )}
      >
        {valor}
      </dd>
    </div>
  );
}
