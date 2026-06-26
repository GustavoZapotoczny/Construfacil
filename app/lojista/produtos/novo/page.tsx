"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { getMinhaLoja, criarProduto, uploadFotoProduto } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { categorias } from "@/lib/data";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Toggle } from "@/components/ui/Toggle";
import { clsx } from "@/lib/cx";

const EMOJIS = ["📦", "🧱", "🪣", "🎨", "🔧", "💡", "🚰", "🪵", "🏠", "⚙️", "🦺", "🪟"];

const UNIDADES = ["Kg", "g", "ton", "un", "m²", "m³", "m", "L", "saco", "caixa", "barra", "pç", "rolo", "pacote"];

export default function NovoProdutoPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: loja } = useAsync(getMinhaLoja, []);

  const [emoji, setEmoji] = useState("📦");
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [categoriaId, setCategoriaId] = useState(categorias[0].id);
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [qtdUnidade, setQtdUnidade] = useState("");
  const [tipoUnidade, setTipoUnidade] = useState("Kg");
  const [estoque, setEstoque] = useState("");
  const [disponivel, setDisponivel] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // Unidade final: "50 Kg" (com número) ou só "un" (sem número).
  const unidade = `${qtdUnidade.trim() ? qtdUnidade.trim() + " " : ""}${tipoUnidade}`;
  const valido = nome.trim() && Number(preco) > 0 && tipoUnidade;

  function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArquivo(f);
    setPreview(URL.createObjectURL(f));
  }

  function removerArquivo() {
    setArquivo(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido || !loja) return;
    setErro("");
    setSalvando(true);
    try {
      const foto = arquivo ? await uploadFotoProduto(arquivo) : emoji;
      await criarProduto({
        lojaId: loja.id,
        nome: nome.trim(),
        categoriaId,
        descricao: descricao.trim(),
        foto,
        preco: Number(preco),
        unidade: unidade.trim(),
        estoque: Number(estoque) || 0,
        disponivel,
      });
      router.push("/lojista/produtos");
    } catch (err) {
      setSalvando(false);
      setErro(
        err instanceof Error ? err.message : "Não foi possível salvar o produto.",
      );
    }
  }

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-100 bg-white px-4 py-3 pt-12">
        <button onClick={() => router.back()} aria-label="Voltar">
          <ArrowLeft size={22} className="text-stone-700" />
        </button>
        <h1 className="font-bold text-stone-800">Novo produto</h1>
      </header>

      <form onSubmit={salvar} className="flex flex-col gap-4 px-4 pt-4">
        {/* Foto: upload OU emoji */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-stone-700">
            Imagem do produto
          </span>
          <div className="flex items-start gap-3">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100 text-3xl">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Prévia" className="h-full w-full object-cover" />
              ) : (
                emoji
              )}
              {preview && (
                <button
                  type="button"
                  onClick={removerArquivo}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-white"
                  aria-label="Remover imagem"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 py-3 text-sm font-medium text-stone-600"
              >
                <ImagePlus size={18} /> Enviar foto
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={escolherArquivo}
                className="hidden"
              />
              <p className="mt-1 text-[11px] text-stone-400">
                Ou escolha um emoji abaixo (usado se não enviar foto).
              </p>
            </div>
          </div>
          {!preview && (
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={clsx(
                    "flex h-10 w-10 items-center justify-center rounded-xl border text-xl transition",
                    emoji === e
                      ? "border-orange-500 bg-orange-50 ring-2 ring-orange-100"
                      : "border-stone-200 bg-white",
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <Campo
          label="Nome"
          placeholder="Ex: Cimento CP-II 50kg"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-700">
            Categoria
          </span>
          <select
            value={categoriaId}
            onChange={(e) => setCategoriaId(e.target.value)}
            className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-orange-500 focus:outline-none"
          >
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.nome}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-700">
            Descrição
          </span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Detalhes do produto"
            rows={3}
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Preço (R$)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0,00"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
          <Campo
            label="Estoque"
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="0"
            value={estoque}
            onChange={(e) => setEstoque(e.target.value)}
          />
        </div>

        {/* Unidade de venda: número + tipo (ex.: 50 Kg, 2 m², un) */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-stone-700">
            Unidade de venda
          </span>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="Quantidade (opcional)"
              value={qtdUnidade}
              onChange={(e) => setQtdUnidade(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-orange-500 focus:outline-none"
            />
            <select
              value={tipoUnidade}
              onChange={(e) => setTipoUnidade(e.target.value)}
              className="w-full rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-orange-500 focus:outline-none"
            >
              {UNIDADES.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-[11px] text-stone-400">
            Como será exibido: <span className="font-medium text-stone-600">{unidade}</span>
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3">
          <div>
            <p className="text-sm font-medium text-stone-800">Disponível</p>
            <p className="text-xs text-stone-500">Aparece no app do cliente</p>
          </div>
          <Toggle ligado={disponivel} onChange={setDisponivel} label="Disponível" />
        </div>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-100 bg-white p-4 md:left-60 md:max-w-6xl">
        {erro && <p className="mb-2 text-center text-xs text-red-600">{erro}</p>}
        <Botao bloco onClick={salvar} disabled={!valido || salvando || !loja}>
          {salvando ? "Salvando…" : "Salvar produto"}
        </Botao>
      </div>
    </div>
  );
}
