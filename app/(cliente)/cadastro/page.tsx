"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Mail, Lock, Phone } from "lucide-react";
import { Campo } from "@/components/ui/Campo";
import { Botao } from "@/components/ui/Botao";
import { Toggle } from "@/components/ui/Toggle";
import { cadastrar as cadastrarAuth } from "@/lib/auth";

export default function CadastroPage() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [senha, setSenha] = useState("");
  const [souLojista, setSouLojista] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  async function cadastrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setAviso("");
    setCarregando(true);
    const tipo = souLojista ? "lojista" : "cliente";
    const r = await cadastrarAuth({ nome, email, senha, telefone, tipo });
    setCarregando(false);
    if (!r.ok) {
      setErro(r.erro ?? "Não foi possível criar a conta.");
      return;
    }
    if (r.precisaConfirmarEmail) {
      setAviso(
        "Conta criada! Confirme o e-mail enviado para concluir o acesso.",
      );
      return;
    }
    router.push(r.tipo === "lojista" ? "/lojista" : "/home");
  }

  return (
    <div className="min-h-screen px-6 pb-8 pt-12">
      <Link href="/login" className="mb-6 inline-flex items-center gap-1 text-stone-500">
        <ArrowLeft size={18} /> Voltar
      </Link>

      <h1 className="text-2xl font-bold text-stone-800">Criar conta</h1>
      <p className="mt-1 text-sm text-stone-500">
        É rápido — comece a pedir em minutos.
      </p>

      <form onSubmit={cadastrar} className="mt-6 flex flex-col gap-4">
        <Campo
          label="Nome"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          iconeEsquerda={<User size={18} />}
        />
        <Campo
          label="E-mail"
          type="email"
          placeholder="voce@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          iconeEsquerda={<Mail size={18} />}
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
        <Campo
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          iconeEsquerda={<Lock size={18} />}
        />

        <div className="flex items-center justify-between rounded-xl border border-stone-200 bg-white p-3">
          <div>
            <p className="text-sm font-medium text-stone-800">Sou lojista</p>
            <p className="text-xs text-stone-500">
              Quero vender materiais no Construfácil
            </p>
          </div>
          <Toggle ligado={souLojista} onChange={setSouLojista} label="Sou lojista" />
        </div>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {erro}
          </p>
        )}
        {aviso && (
          <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {aviso}
          </p>
        )}

        <Botao type="submit" bloco className="mt-2" disabled={carregando}>
          {carregando ? "Criando…" : "Criar conta"}
        </Botao>
      </form>
    </div>
  );
}
