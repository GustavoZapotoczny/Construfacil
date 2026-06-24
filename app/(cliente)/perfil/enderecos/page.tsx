"use client";

import { useState } from "react";
import { MapPin, Plus, Pencil, Trash2, X } from "lucide-react";
import {
  listarEnderecos,
  criarEndereco,
  atualizarEndereco,
  excluirEndereco,
} from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { PageHeader } from "@/components/ui/PageHeader";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Carregando, ErroCarregar, Vazio } from "@/components/ui/Estados";
import type { Endereco } from "@/types";

type Form = Omit<Endereco, "id">;
const vazio: Form = {
  apelido: "",
  rua: "",
  numero: "",
  complemento: "",
  cidade: "",
  cep: "",
};

export default function EnderecosPage() {
  const { data, loading, error, reload } = useAsync(listarEnderecos, []);
  const enderecos = data ?? [];

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [form, setForm] = useState<Form>(vazio);
  const [salvando, setSalvando] = useState(false);

  function abrirNovo() {
    setForm(vazio);
    setEditandoId(null);
    setCriando(true);
  }
  function abrirEdicao(e: Endereco) {
    setForm({ ...e, complemento: e.complemento ?? "" });
    setEditandoId(e.id);
    setCriando(true);
  }
  function fechar() {
    setCriando(false);
    setEditandoId(null);
  }

  const valido = form.apelido.trim() && form.rua.trim() && form.numero.trim();

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!valido) return;
    setSalvando(true);
    try {
      if (editandoId) await atualizarEndereco(editandoId, form);
      else await criarEndereco(form);
      fechar();
      reload();
    } finally {
      setSalvando(false);
    }
  }

  async function remover(id: string) {
    if (!window.confirm("Excluir este endereço?")) return;
    await excluirEndereco(id);
    reload();
  }

  return (
    <div className="min-h-screen pb-24">
      <PageHeader titulo="Endereços" />

      {loading ? (
        <Carregando />
      ) : error ? (
        <ErroCarregar onRetry={reload} />
      ) : (
        <div className="px-4 pt-4">
          {enderecos.length === 0 && !criando ? (
            <Vazio
              emoji="📍"
              titulo="Nenhum endereço"
              descricao="Cadastre um endereço para receber seus pedidos."
            >
              <Botao onClick={abrirNovo}>
                <Plus size={16} /> Adicionar endereço
              </Botao>
            </Vazio>
          ) : (
            <div className="flex flex-col gap-2">
              {enderecos.map((e) => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 rounded-2xl border border-stone-100 bg-white p-3 shadow-sm"
                >
                  <MapPin size={18} className="mt-0.5 shrink-0 text-orange-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-stone-800">
                      {e.apelido}
                    </p>
                    <p className="text-xs text-stone-500">
                      {e.rua}, {e.numero}
                      {e.complemento ? ` — ${e.complemento}` : ""}
                      {e.cidade ? ` · ${e.cidade}` : ""}
                      {e.cep ? ` · ${e.cep}` : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => abrirEdicao(e)}
                    aria-label="Editar"
                    className="text-stone-400 transition hover:text-orange-600"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => remover(e.id)}
                    aria-label="Excluir"
                    className="text-stone-400 transition hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}

              {!criando && (
                <button
                  onClick={abrirNovo}
                  className="mt-1 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-stone-300 py-3 text-sm font-semibold text-orange-600"
                >
                  <Plus size={16} /> Adicionar endereço
                </button>
              )}
            </div>
          )}

          {/* Formulário de novo/editar */}
          {criando && (
            <form
              onSubmit={salvar}
              className="mt-3 flex flex-col gap-3 rounded-2xl border border-orange-200 bg-orange-50/50 p-3"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-stone-800">
                  {editandoId ? "Editar endereço" : "Novo endereço"}
                </h2>
                <button type="button" onClick={fechar} aria-label="Fechar">
                  <X size={18} className="text-stone-400" />
                </button>
              </div>
              <Campo
                label="Apelido"
                placeholder="Casa, Obra, Trabalho…"
                value={form.apelido}
                onChange={(e) => setForm({ ...form, apelido: e.target.value })}
              />
              <div className="grid grid-cols-[1fr_90px] gap-2">
                <Campo
                  label="Rua"
                  placeholder="Rua / Avenida"
                  value={form.rua}
                  onChange={(e) => setForm({ ...form, rua: e.target.value })}
                />
                <Campo
                  label="Número"
                  placeholder="123"
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </div>
              <Campo
                label="Complemento"
                placeholder="Apto, bloco, referência (opcional)"
                value={form.complemento ?? ""}
                onChange={(e) => setForm({ ...form, complemento: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Campo
                  label="Cidade"
                  value={form.cidade}
                  onChange={(e) => setForm({ ...form, cidade: e.target.value })}
                />
                <Campo
                  label="CEP"
                  placeholder="00000-000"
                  value={form.cep}
                  onChange={(e) => setForm({ ...form, cep: e.target.value })}
                />
              </div>
              <Botao type="submit" bloco disabled={!valido || salvando}>
                {salvando ? "Salvando…" : "Salvar endereço"}
              </Botao>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
