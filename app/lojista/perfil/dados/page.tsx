"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { getMinhaLoja, atualizarLoja, uploadFotoProduto } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { SubHeader } from "@/components/lojista/SubHeader";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { FotoProduto } from "@/components/ui/FotoProduto";
import { Carregando } from "@/components/ui/Estados";
import { clsx } from "@/lib/cx";

const EMOJIS = ["🏗️", "🧰", "🏬", "🔩", "🧱", "🪵", "🎨", "🚰", "🪟", "🔧"];

export default function DadosLojaPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: loja, loading } = useAsync(getMinhaLoja, []);

  const [logo, setLogo] = useState("🏗️"); // emoji OU url já salva
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [endereco, setEndereco] = useState("");
  const [tempo, setTempo] = useState("");
  const [taxa, setTaxa] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!loja) return;
    setLogo(loja.logo || "🏗️");
    setNome(loja.nome);
    setDescricao(loja.descricao);
    setEndereco(loja.endereco);
    setTempo(loja.tempoEstimado);
    setTaxa(String(loja.taxaEntrega ?? 0));
  }, [loja]);

  function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setArquivo(f);
    setPreview(URL.createObjectURL(f));
    setOk(false);
  }

  function removerArquivo() {
    setArquivo(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!loja) return;
    setErro("");
    setOk(false);
    setSalvando(true);
    try {
      // Se enviou uma imagem, sobe pro Storage e usa a URL; senão usa o emoji.
      const logoFinal = arquivo ? await uploadFotoProduto(arquivo) : logo;
      await atualizarLoja(loja.id, {
        nome: nome.trim(),
        descricao: descricao.trim(),
        logo_url: logoFinal,
        endereco: endereco.trim(),
        tempo_estimado: tempo.trim(),
        taxa_entrega: Number(taxa) || 0,
      });
      setLogo(logoFinal);
      setArquivo(null);
      setOk(true);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (loading) return <Carregando />;

  return (
    <div className="min-h-screen pb-28">
      <SubHeader titulo="Dados da loja" />

      <form onSubmit={salvar} className="flex flex-col gap-4 px-4 pt-4">
        <div>
          <span className="mb-1.5 block text-sm font-medium text-stone-700">
            Logo da loja
          </span>
          <div className="flex items-start gap-3">
            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-stone-200 bg-stone-100 text-3xl">
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview} alt="Prévia" className="h-full w-full object-cover" />
              ) : (
                <FotoProduto foto={logo} alt="Logo atual" emojiClassName="text-3xl" />
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
                <ImagePlus size={18} /> Enviar minha logo
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={escolherArquivo}
                className="hidden"
              />
              <p className="mt-1 text-[11px] text-stone-400">
                Ou escolha um emoji abaixo.
              </p>
            </div>
          </div>
          {!preview && (
            <div className="mt-2 flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setLogo(e)}
                  className={clsx(
                    "flex h-11 w-11 items-center justify-center rounded-xl border text-2xl transition",
                    logo === e
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

        <Campo label="Nome da loja" value={nome} onChange={(e) => setNome(e.target.value)} />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-stone-700">
            Descrição
          </span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-stone-200 bg-white px-3 py-3 text-sm text-stone-800 focus:border-orange-500 focus:outline-none"
          />
        </label>

        <Campo
          label="Endereço"
          placeholder="Rua, número — bairro"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-3">
          <Campo
            label="Tempo estimado"
            placeholder="30-45 min"
            value={tempo}
            onChange={(e) => setTempo(e.target.value)}
          />
          <Campo
            label="Taxa de entrega (R$)"
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={taxa}
            onChange={(e) => setTaxa(e.target.value)}
          />
        </div>
        <p className="-mt-2 text-[11px] text-stone-400">
          Taxa 0 = frete grátis para esta loja.
        </p>
      </form>

      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t border-stone-100 bg-white p-4">
        {erro && <p className="mb-2 text-center text-xs text-red-600">{erro}</p>}
        {ok && (
          <p className="mb-2 text-center text-xs font-medium text-green-600">
            Dados salvos! ✓
          </p>
        )}
        <Botao bloco onClick={salvar} disabled={salvando || !nome.trim()}>
          {salvando ? "Salvando…" : "Salvar alterações"}
        </Botao>
      </div>
    </div>
  );
}
