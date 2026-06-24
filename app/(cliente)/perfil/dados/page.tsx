"use client";

import { useEffect, useState } from "react";
import { User, Mail, Phone } from "lucide-react";
import { getMeuPerfil, atualizarMeuPerfil } from "@/lib/repo";
import { useAsync } from "@/lib/useAsync";
import { PageHeader } from "@/components/ui/PageHeader";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Carregando } from "@/components/ui/Estados";

export default function DadosPessoaisPage() {
  const { data: perfil, loading } = useAsync(getMeuPerfil, []);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [ok, setOk] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (!perfil) return;
    setNome(perfil.nome);
    setTelefone(perfil.telefone);
  }, [perfil]);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setOk(false);
    setSalvando(true);
    try {
      await atualizarMeuPerfil({ nome: nome.trim(), telefone: telefone.trim() });
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
      <PageHeader titulo="Dados pessoais" />

      <form onSubmit={salvar} className="flex flex-col gap-4 px-4 pt-4">
        <Campo
          label="Nome"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          iconeEsquerda={<User size={18} />}
        />
        <Campo
          label="Celular"
          type="tel"
          inputMode="tel"
          placeholder="(00) 00000-0000"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
          iconeEsquerda={<Phone size={18} />}
        />
        <div>
          <Campo
            label="E-mail"
            value={perfil?.email ?? ""}
            disabled
            iconeEsquerda={<Mail size={18} />}
          />
          <p className="mt-1 text-[11px] text-stone-400">
            O e-mail de acesso não pode ser alterado por aqui.
          </p>
        </div>
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
